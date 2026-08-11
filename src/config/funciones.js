import { servidor, ajustarFechaUtc, servidor_n8n, servidorNew } from "./utils";
import { Problems } from "./Problems";
import { contextTest } from "./utils";

function base64ToBytes(b64) {
  b64 = (b64 || "").trim().replace(/\s+/g, "");
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeBase64Json(b64) {
  const bytes = base64ToBytes(b64);
  const text = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(text);
}

function decodeContextParam(raw) {
  // 1) por si viene URL-encoded
  const value = decodeURIComponent(raw);

  // 2) si es JWT (xxx.yyy.zzz), decodifica payload
  if (value.includes(".")) {
    const parts = value.split(".");
    if (parts.length >= 2) return decodeBase64Json(parts[1]);
  }

  // 3) base64/base64url normal
  try {
    return decodeBase64Json(value);
  } catch (_) {
    // 4) fallback: a veces viene doble-encodificado (base64 de string base64)
    const once = new TextDecoder("utf-8").decode(base64ToBytes(value));
    return decodeBase64Json(once);
  }
}

export const cargarContexto = async () => {
  const urlParams = new URLSearchParams(location.search);
  const contextParam = urlParams.get("context");
  //const contextParam  = contextTest

  if (!contextParam) {
    return { account: "", user: "", person: "" };
  }

  try {
    // OJO: esto ya regresa objeto
    const context = decodeContextParam(contextParam);

    const account = context.account || {};
    const user = context.user || {};
    const person = context.person || {};
    
    if (user?.id) {
      const response = await getRoleUser(user.id,"id,name,email,role");
      return { account, user: response, person };
    }

    return { account: "", user: "", person: "" };
  } catch (error) {
    console.error("Error al decodificar o parsear el contexto:", error);
    return { account: "", user: "", person: "" };
  }
};


async function getRoleUser(id, fields = "") {
  try {
    const queryParams = fields
      ? `?fields=${encodeURIComponent(fields)}`
      : "";

    const url = `${servidorNew}/api/users/${id}${queryParams}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `${response.status} - ${response.statusText}`
      );
    }

    const user = await response.json();

    return user.data;
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    throw error;
  }
}

export const searchPersonById = async (id) => {
  const url = `${servidorNew}/api/people/${id}?fields=allFields`; // Changed to GET 
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const searchPersonRelationshipById = async (id) => {
  const url = `${servidorNew}/api/peopleRelationships?personId=${id}`; // Changed to GET
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const filtrarDataPerson = (person, appt) => {
  const data = {};

  //data.personId = { clave: "ID", value: person.id };
  data.leadType = { clave: "Lead Type", value: person.customNEWServiceType };
  data.pipelines = { clave: "Pipeline", value: person.customNEWPIPELINE };
  data.stage = { clave: "Stage", value: person.stage };
  data.attemps = { clave: "Attemps", value: person.customVANOANSWERATTEMPTS };
  data.contactFuture = {
    clave: "Contact Future",
    value: person.customNEWClientOpenToNewContactInTheFuture,
  }; //Hasta aqui es para todos

  if (
    person.customNEWPIPELINE !== "Incomplete Client Profile" &&
    person.customNEWPIPELINE
  ) {
    data.clientQualify = {
      clave: "Legal Status",
      value: person.customNEWClientSQualifyAs,
    };
    data.debtProblem = {
      clave: "Debt Problem",
      value: person.customDebtProblem,
    };
    //Problems
    data.problems = Problems.BuyerSeller.map((item) => ({
      ...item, // Conservamos todas las propiedades originales
      value: person[item.clave] ? "Yes" : false, // Añadimos el nuevo campo
    }));
    //Texto del Problema Other
    if (person.customNEWProblemOther !== null) {
      data.textValue = {
        clave: "Other Problem",
        value: person.customNEWProblemOther,
      };
    }
    //Si el Appoiment es distinto de null
    if (person) {
      //Appoitment
      data.appointment = {
        clave: "Appt Details",
        value: person.customNewDidTheClientHadAnAppointmentBefore,
      };
      data.appointment = {
        clave: "Date Appt",
        value: ajustarFechaUtc(appt?.start) || "",
      };
      data.apptType = {
        clave: "Appt Type",
        value: appt?.type || "",
      };
      data.outcome = {
        clave: "Appt Outcome",
        value: appt?.outcome || "",
      };
      //Realtor or Lender
      data.isRealtorOrLender = {
        clave: "Meeting With",
        value: person.customNEWAPPTLenderOrRealtor,
      };
      if (data.isRealtorOrLender.value === "Lender")
        data.realtorLenderValue = {
          clave: "Lender´s Name",
          value: person.customNEWAPPTLenderOrRealtorLender,
        };
      if (data.isRealtorOrLender.value === "Realtor")
        data.realtorLenderValue = {
          clave: "Realtor´s Name",
          value: person.customNEWAPPTLenderOrRealtorRealtor,
        };

      //Cita
      data.cita = {
        clave: "Appt Status",
        value: person.customNEWAPPTDidTheClientWentToTheirLastAppointment,
      };
      if (data.cita.value === "Appt NOT Attended") {
        //Cuando cita es NO
        data.whyNoCita = {
          clave: "No-Show Reason",
          value: person.customNEWAPPTNoNoShowReason,
        };
        //Why No Cita type Problem
        if (data.whyNoCita.value === "External Problems") {
          data.problem = {
            clave: "External",
            value: person.customNEWAPPTNoExternalProblems,
          };
        } else {
          if (data.whyNoCita.value === "Internal Problems") {
            data.problem = {
              clave: "Internal",
              value: person.customNEWAPPTNoInternalProblems,
            };
          }
        }
      } else {
        if (data.cita.value === "Appt Attended") {
          data.actions = {
            clave: "Appt Results",
            value: person.customNEWAPPTYesApptResults,
          };
          //Diferentes tipos de actions

          if (data.actions.value === "Qualify//Sign") {
            data.calificaFirma = {
              clave: "Qualify or Sign",
              value: person.customNEWAPPTYesActionsQualifyOrSign,
            };
          } else {
            if (data.actions.value === "Client Pending Action") {
              data.pendiente = {
                clave: "Pending Action",
                value: person.customNEWAPPTYesResultPendingActions,
              };
              data.datePending = {
                clave: "Date Pending Action",
                value: person.customNewApptYesResultPendingActionDATE,
              };
            } else {
              if (data.actions.value === "Didn´t qualify// Didn´t sign") {
                data.requisitos = {
                  clave: "Result Details",
                  value: person.customNEWAPPTYesActionsDidnTQualifyDidnTSign,
                };

                if (data.requisitos.value === "Decided to Quit") {
                  data.whyNoContinue = {
                    clave: "Why No Continue",
                    value:
                      person.customNEWAPPTYesActionsDidnTQualifyDidnTSignDidn,
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return data;
};
export const obtainHomes = async (id) => {
  const url = `${servidorNew}/api/homes/people/${id}`; // Changed to GET
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      return { success: false };
    }

    const data = await response.json();

    return data;
  } catch {
    return [];
  }
};
//obtener los appoitmentOutcome
export const searchAppointmentOutcomeFUB = async () => {
  const url = `${servidor}/api/embededapp/camilo/appointmentOutcomes`; // Changed to GET

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//obtener los appoitmentTypeOutcome
export const searchAppointmentTypeOutcomeFUB = async () => {
  const url = `${servidor}/api/embededapp/camilo/appointmentTypeOutcomes`; // Changed to GET

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//agregar appointment
export const addAppointment = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/addAppointment`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//agregar appointment
export const addAppointmentMongoDb = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/addAppointmentMongoDb`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//editar appointment
export const editAppointment = async (data, id) => {
  const url = `${servidor}/api/embededapp/camilo/editAppointment`; // Changed to GET

  data.apptId = id;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//agregar appointment
export const searchPersonUser = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/peopleUsers/${data}`; // Changed to GET

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const deleteAppointment = async (id) => {
  const url = `${servidor}/api/embededapp/camilo/removeAppointment/${id}`; // Changed to GET
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//obtener los appoitment del cliente desde Follow Up Boss
export const searchAppointmentFUB = async (id) => {
  //const url = `${servidor}/api/embededapp/camilo/appointment/${id}`; // Changed to GET
  const url = `${servidorNew}/api/appointments?personId=${id}`;

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//obtener los appoitment del cliente desde Mongo DB
export const searchAppointmentMongoDb = async (id) => {
  const url = `${servidor}/api/embededapp/camilo/getAppointmentByPersonId/${id}`; // Changed to GET

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const getChoicesCustomFields = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/getChoicesCustomFields`; // Changed to GET
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const searchStages = async () => {
  const url = `${servidor}/api/embededapp/camilo/searchStages`; // Changed to GET
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const putStage = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/update`; // Changed to GET
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const putTask = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/updateTask`; // Changed to GET
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//actualizar el appoitment
export const updateAppointment = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/appointmentUpdate`; // Changed to GET

  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const buildData = (appt, cita, context) => {
  let dataBuild = {};
  console.log(appt, cita, context);
  //Para todos
  dataBuild.personId = context.person.id;
  dataBuild.customNewDidTheClientHadAnAppointmentBefore = appt?.apptName || ""; //"(NEW) Did the client had an appointment before?"

  //Para Accordion 3 APPT
  if (appt?.apptName !== "") {
    dataBuild.customNEWAPPTLenderOrRealtor = appt.realtorLender; //(NEW) APPT: Lender or Realtor
    if (appt.realtorLender === "Realtor") {
      dataBuild.customNEWAPPTLenderOrRealtorRealtor = appt.realtorLenderValue; //Nombre del realtor o el Lender
    } else {
      dataBuild.customNEWAPPTLenderOrRealtorLender = appt.realtorLenderValue; //Nombre del realtor o el Lender
    }
  }
  //Para Accordion 4 CITA
  if (appt?.appointment !== "") {
    dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment = cita.cita; //"(NEW) APPT -- Did the client went to their last appointment?"

    switch (cita.cita) {
      case "Appt NOT Attended":
        dataBuild.customNEWAPPTNoNoShowReason = cita.whyNoCita; //"(NEW) APPT (No) -- No Show Reason
        if (cita.whyNoCita === "External Problems") {
          dataBuild.customNEWAPPTNoShowExternalProblems = cita.problem; //(NEW) APPT (No) -- External problems
          dataBuild.customNEWAPPTNoShowInternalProblems = ""; //(NEW) APPT (No) -- internal problems
        } else {
          dataBuild.customNEWAPPTNoShowInternalProblems = cita.problem; //(NEW) APPT (No) -- internal problems
          dataBuild.customNEWAPPTNoShowExternalProblems = ""; //(NEW) APPT (No) -- External problems
        }
        break;
      case "Waiting for Appt date":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          cita.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        break;
      case "Appt not valid (admin Only)":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          cita.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        break;
      case "Appt Attended":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          cita.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        dataBuild.customNEWAPPTYesApptResults = cita.actions; //(NEW) APPT (YES)-Actions

        if (cita.actions === "Qualify//Sign") {
          dataBuild.customNEWAPPTYesActionsQualifyOrSign = cita.calificaFirma;
        } else {
          if (cita.actions === "Client Pending Action") {
            dataBuild.customNEWAPPTYesResultPendingActions = cita.pendiente;
            dataBuild.customNewApptYesResultPendingActionDATE =
              cita.datePending;
          } else {
            if (cita.actions === "Didn´t qualify// Didn´t sign") {
              dataBuild.customNEWAPPTYesActionsDidnTQualifyDidnTSign =
                cita.requisitos;
              dataBuild.customNEWAPPTYesActionsDidnTQualifyDidnTSignDidn =
                cita.whyNoContinue;
            }
          }
        }
        break;

      default:
        break;
    }
  }
  /*
  console.log(data);
  // Para Componente Cita
  if (data.appointment !== "") {
    switch (data.cita) {
      case "Appt NOT Attended":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          data.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        dataBuild.customNEWAPPTNoWhyTheClientDidnTWentToTheAppointment =
          data.whyNoCita; //"(NEW) APPT (No) -- Why the client didn´t went to the appointment"
        if (data.whyNoCita === "External Problems") {
          dataBuild.customNEWAPPTNoExternalProblems = data.problem; //(NEW) APPT (No) -- External problems
          dataBuild.customNEWAPPTNoInternalProblems = ""; //(NEW) APPT (No) -- internal problems
        } else {
          dataBuild.customNEWAPPTNoInternalProblems = data.problem; //(NEW) APPT (No) -- internal problems
          dataBuild.customNEWAPPTNoExternalProblems = ""; //(NEW) APPT (No) -- External problems
        }
        break;
      case "Waiting for Appt date":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          data.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        break;
      case "Appt not valid (admin Only)":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          data.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        break;
      case "Appt Attended":
        dataBuild.customNEWAPPTDidTheClientWentToTheirLastAppointment =
          data.cita; //"(NEW) APPT -- Did the client went to their last appointment?"
        dataBuild.customNEWAPPTYesActions = data.actions; //(NEW) APPT (YES)-Actions

        if (data.actions === "Qualify//Sign") {
          dataBuild.customNEWAPPTYesActionsQualifyOrSign = data.calificaFirma;
        } else {
          if (data.actions === "Pending actions") {
            dataBuild.customNEWAPPTYesActionsPendingActions = data.pendiente;
            dataBuild.datePendingAction = data.datePendingAction;
          } else {
            if (data.actions === "Didn´t qualify// Didn´t sign") {
              dataBuild.customNEWAPPTYesActionsDidnTQualifyDidnTSign =
                data.requisitos;
              dataBuild.customNEWAPPTYesActionsDidnTQualifyDidnTSignDidn =
                data.whyNoContinue;
            }
          }
        }
        break;

      default:
        break;
    }
  }*/

  return dataBuild;
};
//actualizar el appointment en googleSheet
export const saveAppointment = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/appointmentSaveSheet`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
//actualizar el appoitment CAPTACION en Mongo db
export const saveAppointmentMongoCaptacion = async (
  data,
  context,
  nameProblems,
  taskCall,
  taskThankYou
) => {
  const dataSaved = buildDataMongoCaptacion(
    data,
    context,
    nameProblems,
    taskCall,
    taskThankYou
  );

  const url = `${servidor}/api/embededapp/camilo/addCaptacionPeople`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(dataSaved),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
export const saveAppointmentMongoCaptacionV2 = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/addCaptacionPeople`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

function buildDataMongoCaptacion(
  dataSaved,
  context,
  nameProblems,
  taskCall,
  taskThankYou
) {
  const data = {};

  data.personId = context.person.id;
  data.va = context.user.name;
  data.leadType = dataSaved?.leadType || "";
  data.pipeline = dataSaved?.pipeline || "";
  data.stage = dataSaved?.stage || "";
  data.attemps = dataSaved?.attemps || "";
  data.contactFuture = dataSaved?.contactFuture || "";

  data.legalStatus = dataSaved?.clientQualify || "";
  data.dataDebs = dataSaved?.debs || "";
  data.debtProblem = dataSaved?.debtProblem || "";

  data.zillowEstimated = dataSaved?.zillowEstimated || "";
  data.bestEstimated = dataSaved?.bestEstimated || "";
  data.sellerAddress = dataSaved?.sellerAddress || "";
  data.sellerPending = dataSaved?.sellerPending || "";
  data.buyerPotencial = dataSaved?.buyerPotencial || "";
  data.citaAgendada = dataSaved?.dataSaved || "",
    data.optionsBuyerPotencial = {
      credito: dataSaved?.credito,
      ahorro: dataSaved?.ahorro,
      renta: dataSaved?.renta,
      mercado: dataSaved?.mercado,
      info: dataSaved?.info
    }

  data.problems = nameProblems || "";
  data.notaPond = dataSaved?.notaPond || ""

  data.whyIsOut = dataSaved?.whyIsOut || "";
  data.whenIsOut =
    dataSaved?.stage === "4- DECIDED TO QUIT *"
      ? ajustarFechaUtc(new Date().toISOString())
      : "";
  if (taskCall !== undefined) {
    data.taskCall = taskCall;
  }
  if (taskThankYou !== undefined) {
    data.taskThankYou = taskThankYou;
  }


  return data;
}
//actualizar el appoitment DATOS CLIENTE en Mongo db
export const saveAppointmentMongoDatosCliente = async (data, context, appt) => {
  const dataSaved = buildDataMongoDatosCliente(data, context, appt);

  const url = `${servidor}/api/embededapp/camilo/addDatosClientePeople`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(dataSaved),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const saveAppointmentMongoDatosClienteV2 = async (dataSaved) => {
  const url = `${servidor}/api/embededapp/camilo/addDatosClientePeople`; // Changed to GET

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(dataSaved),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

function buildDataMongoDatosCliente(dataSaved, context, appt) {
  const data = {};
  console.log(dataSaved);

  data.vaName = context.user.name;
  data.personId = context.person.id;
  data.appointmentId = Number(dataSaved?.appointment) || "";
  data.appointmentName = dataSaved?.apptName || "";
  data.appointmentTypeId = dataSaved?.typeOutcome || "";
  data.appointmentOutcomeId = dataSaved?.outcome || "";
  data.appointmentType = dataSaved?.typeOutcomeName || appt.type || "";
  data.appointmentOutcome = dataSaved?.outcomeName || appt.outcome || "";
  data.appointmentStart = appt?.start || "";

  data.realtorOrLender = dataSaved.realtorLender;
  data.realtorOrLenderName = dataSaved.realtorLenderValue;

  data.attendance = dataSaved.cita;
  data.typeProblems = dataSaved.whyNoCita;
  data.problem = dataSaved.problem;

  data.results = dataSaved?.actions || "";
  data.pending = dataSaved?.pendiente || "";
  data.datePending = dataSaved.datePending
    ? new Date(dataSaved.datePending).toISOString()
    : "";

  return data;
}

export const getCaptacionPeopleMongo = async (id) => {
  const url = `${servidorNew}/api/captacion_peoples/${id}`; // Changed to GET

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const postTask = async (data) => {
  const url = `${servidor}/api/embededapp/camilo/createTask`; // Changed to GET
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const deletePersonCitaMongo = async (personId, apptId) => {
  const url = `${servidor}/api/embededapp/camilo/deletePeopleCita/${personId}`; // Changed to GET
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ appointmentId: apptId }),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const getAppointmentMongo = async (id) => {
  //const url = `${servidor}/api/embededapp/camilo/getAppointmentById/${id}`; // Changed to GET
  const url = `${servidorNew}/api/appts/allData?apptId=${id}`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return errorMessage;
    }

    const result = await response.json();

    return result.data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const searchCustomFields = async () => {
  const url = `${servidorNew}/api/customFields`; // Changed to GET
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const result = await response.json();

    return result.data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const createNote = async (data) => {
  const url = `${servidorNew}/api/notes`; // Changed to GET
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const getDealTransaction = async (id) => {
  const url = `${servidor}/api/embededapp/camilo/searchDealPerson/${id}`; // Changed to GET

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add authorization if needed: "Authorization": `Bearer ${token}`
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const sendDataN8N = async (data) => {
  try {

    const urlNumeros = `${servidor_n8n}/webhook/5cf054bd-0afa-4320-82c8-1da7c586d317`

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
      },
      body: JSON.stringify({ data }),
    };

    const response = await fetch(urlNumeros, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.error(errorMessage);
      return [];
    }

    const result = await response.json().catch(() => ({}));

    return result;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

export const buildDataN8N = (
  person,
  leadType,
  language,
  clientQualify,
  name,
  type,
  title,
  startGhl,
  endGhl,
  realtorLender,
  realtorLenderValue,
  whereCita,
  numSmsGhl,
  dataSaved, context
) => {
  const data = {};

  if (person?.phones?.length === 0) {
    return data;
  }
  const parts = name.trim().split(" ");

  // Toma los dos primeros nombres/apellidos
  const shortName = `${parts[0]}-${parts[1]}`;
  let filter = "office";

  switch (whereCita) {
    case "Office Appt":
      filter = "office";
      break;
    case "Phone Appt":
      filter = "phone";
      break;
    case "Meeting Address Appt":
      filter = "address";
      break;
    default:
      break;
  }

  data.firstName = person.firstName;
  data.lastName = person.lastName;
  data.email = person.emails.length > 0 ? person.emails[0].value : "";
  data.locationId = "M26L1beTtBKSRJUF2dUn";

  data.phone = numSmsGhl
  data.leadType = leadType;
  data.language = language;
  data.clientQualify = clientQualify;
  data.cita = "Waiting for Appt Date";
  data.name = `${shortName}-${filter}`.toLowerCase();
  data.title = title;
  data.startTime = startGhl;
  data.endTime = endGhl;
  data.personId = person.id;
  data.type = realtorLender;
  data.nombre = realtorLenderValue;
  data.whereCita = whereCita;
  data.assignedTo = person.assignedTo;
  data.personId = person?.id;
  data.apptId = dataSaved.data.appointment.id || null;
  data.userId = context?.user?.id || null;

  return data;
};

export const handleSearchAutomathic = async (value) => {
  if (value.trim().length < 2) {
    return;
  }

  try {
    const res = await searchPersonUser(value); // Tu función ya hecha

    if (res?.length) {
      return res[0]
    } else {
      console.log("Empty")
      return
    }
  } catch (err) {
    console.error("Error buscando:", err);
  }
};

export const getTasksPerson = async (id) => {
  const url = `${servidor}/api/tasks/${id}`; // Changed to GET
  const options = {
    method: "GET",
    headers: {
      contentType: "application/json",
    },
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

export const getUsers = async () => {
  const url = `${servidor}/api/users`; // Changed to GET 
  const options = {
    method: "GET",
    headers: {
      contentType: "application/json",
    },
  }
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      return [];
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

export const createTask = async (data) => {
  const url = `${servidor}/api/tasks`; // Changed to GET
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

export const deleteTask = async (taskId) => {
  const url = `${servidor}/api/tasks/${taskId}`; // Changed to GET
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

export const completeTask = async (taskId, value) => {
  const url = `${servidor}/api/tasks/complete/${taskId}?value=${value}`; // Changed to GET
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

export const editTask = async (data, taskId) => {
  const url = `${servidor}/api/tasks/${taskId}`; // Changed to GET
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      console.log(errorMessage);
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

/////////desde nuevo servidor\

//actualizar persona
export const updatePeople = async (id, body) => {
  try {
    const resp = await fetch(`${servidorNew}/api/people/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw new Error("Error actualizando el registro");

    const result = await resp.json();
    return result;

  } catch (error) {
    console.log(error);
    return null;
  }
};

//OBTENER CUSTOM FIELDS
export const getCustomFields = async (ids) => {
  try {
    const resp = await fetch(`${servidorNew}/api/custom-Fields?ids=${ids}`);
    if (!resp.ok) throw new Error("Error cargando customFields");
    const result = await resp.json()

    return result;
  } catch (error) {
    console.log(error)
    return []
  }
}
