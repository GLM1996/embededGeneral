export const servidor_n8n = "https://n8n.homelasvegasnevada.com"
export const servidor = "https://servernode.homelasvegasnevada.com"
export const servidorNew = "https://servidor.homelasvegasnevada.com"
// export const servidor = "http://localhost:5500";
// export const servidorNew = "http://localhost:3001"
export const contextTest = "eyJjb250ZXh0IjoicGVyc29uIiwiYWNjb3VudCI6eyJpZCI6MjExNDI1NTIwMywiZG9tYWluIjoiaG9tZWxhc3ZlZ2FzbmV2YWRhIiwib3duZXIiOnsibmFtZSI6Ikp1YW4gQ2FybG9zIENhcnJlcmEiLCJlbWFpbCI6ImhvbWVsYXN2ZWdhc25ldmFkYUBnbWFpbC5jb20ifX0sInVzZXIiOnsiaWQiOjEwMCwibmFtZSI6Ikd1c3Rhdm8gTGVvbiIsImVtYWlsIjoiZXN0cmVsbGFnbG05NkBnbWFpbC5jb20ifSwicGVyc29uIjp7ImlkIjo2MTA1OSwiZmlyc3ROYW1lIjoiVGVzdCBHdXN0YXZvIE5ldyIsImxhc3ROYW1lIjoiIiwicGhvbmVzIjpbXSwiZW1haWxzIjpbeyJ2YWx1ZSI6ImVzdHJlbGxhZ2xtOTZAZ21haWwuY29tIiwidHlwZSI6ImhvbWUiLCJzdGF0dXMiOiJWYWxpZCIsImlzUHJpbWFyeSI6MSwicmVsYXRpb25zaGlwSWQiOjB9XSwic3RhZ2UiOnsiaWQiOjIsIm5hbWUiOiJMZWFkIn19fQ"

import { Problems } from "./Problems";
import moment from "moment-timezone";
 
export const convertTo24Hour = (timeString) => {
  const [time, period] = timeString.split(" ");
  let hours, minutes;

  if (time.includes(":")) {
    [hours, minutes] = time.split(":");
  } else if (time.includes(".")) {
    [hours, minutes] = time.split(".");
  } else {
    // Valor por defecto o manejo de error si no tiene ni ":" ni "."
    [hours, minutes] = [null, null];
  }

  if (period.toLowerCase() === "pm" && hours !== "12") {
    hours = String(parseInt(hours, 10) + 12).padStart(2, "0");
  } else if (period.toLowerCase() === "am" && hours === "12") {
    hours = "00";
  }

  return `${hours}:${minutes}`;
};

export const formatUsd = (amount) => {
  if (amount) {
    const formattedUSD = amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formattedUSD;
  }
  return "$ 0";
};

export const ajustarFecha = (selectedDate, selectedTime) => {
  const timeFormated = convertTo24Hour(selectedTime);
  console.log(selectedTime, timeFormated);
  const fechaPT = moment.tz(
    `${selectedDate} ${timeFormated}`,
    "YYYY-MM-DD HH:mm",
    "America/Los_Angeles"
  );
  return fechaPT.toISOString();
};

export const buildDataFub = (data, context) => {
  let dataBuild = {};

  //Para todos
  dataBuild.personId = context.person.id;
  dataBuild.customNEWServiceType = data.leadType; //(NEW) Service Type
  dataBuild.customNEWPIPELINE = data.pipeline; //(NEW) PIPELINE
  dataBuild.stage = data.stage; //Stage de la persona
  dataBuild.customVANOANSWERATTEMPTS = data.attemps; //(VA) NO ANSWER - ATTEMPTS
  dataBuild.customNEWClientOpenToNewContactInTheFuture = data.contactFuture; //(NEW) Client open to new contact in the future

  //Problems
  Problems.BuyerSeller.forEach((item) => {
    if (
      data[item.clave] !== undefined &&
      item.clave !== "customNEWProblemOther"
    ) {
      dataBuild[item.clave] = data[item.clave];
    }
  });

  dataBuild.customNEWProblemOther = data.textValue ?? "";

  return dataBuild;
};

export const filtrarDataPerson = (person) => {
  const data = {};

  //data.personId = { clave: "ID", value: person.id };
  data.leadType = { clave: "Lead Type", value: person.customNEWServiceType };
  data.pipeline = { clave: "Pipeline", value: person.customNEWPIPELINE };
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
    if (person.customNEWAPPTDidTheClientWentToTheirLastAppointment !== null) {
      //Appoitment
      data.appointment = {
        clave: "Appt Details",
        value: person.customNEWAPPTDidTheClientWentToTheirLastAppointment,
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
          value: person.customNEWAPPTNoWhyTheClientDidnTWentToTheAppointment,
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
            value: person.customNEWAPPTYesActions,
          };
          //Diferentes tipos de actions

          if (data.actions.value === "Qualify//Sign") {
            data.calificaFirma = {
              clave: "Qualify or Sign",
              value: person.customNEWAPPTYesActionsQualifyOrSign,
            };
          } else {
            if (data.actions.value === "Pending actions") {
              data.pendiente = {
                clave: "Pending actions",
                value: person.customNEWAPPTYesActionsPendingActions,
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

export const ajustarFechaUtc = (selectedDate) => {
  if (!selectedDate) return null;

  // 1. Crear un objeto Date con la fecha UTC
  const fecha = new Date(selectedDate);

  // 2. Restar 6 horas directamente al objeto Date (maneja automáticamente los cambios de día)
  fecha.setUTCHours(fecha.getUTCHours() - 6);

  // 3. Extraer los componentes ya ajustados
  const year = fecha.getUTCFullYear();
  const month = fecha.getUTCMonth() + 1; // Los meses son 0-indexados
  const day = fecha.getUTCDate();
  let hours = fecha.getUTCHours();
  const minutes = fecha.getUTCMinutes();

  // 4. Determinar AM/PM y ajustar formato de horas
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  // 5. Función auxiliar para padding
  const pad = (num) => num.toString().padStart(2, "0");

  // 6. Devolver la cadena formateada
  return `${year}-${pad(month)}-${pad(day)} ${pad(displayHours)}:${pad(
    minutes
  )} ${period}`;
};

export const ajustarFechaUtcModify = (selectedDate) => {
  if (!selectedDate) return null;

  // 1. Convertir a Pacific Time (PST/PDT automático)
  const fechaPT = moment.utc(selectedDate).tz("America/Los_Angeles");

  // 2. Usar tu función formatearFecha (ajustada para compatibilidad)
  const fechaFormateada = formatearFecha(fechaPT.toDate()); // -> "December 25, 2023"

  // 3. Formatear hora en 12h con AM/PM
  const horaFormateada = fechaPT.format("hh:mm A"); // -> "11:00 AM"

  return `${fechaFormateada} ${horaFormateada}`;
};

export const formatearFecha = (date) => {
  //moment(date).format("MMMM D, YYYY HH:mm"); // Ej: "December 25, 2023"
  return moment.tz(date, "America/Los_Angeles").format("MMMM D, YYYY");
};

export const formatearFechaSplit = (date) => {
  return moment.tz(date, "America/Los_Angeles").format("YYYY-MM-DD");
};

export const normalizeString = (str) => str.toLowerCase().replace(/\s+/g, "");

export const obtenerFechasVecinas = (startDate, startTime) => {
  const fechaCitaOriginal = ajustarFecha(startDate, startTime);
  const fechaCitaMorning = ajustarFecha(startDate, "08:00 AM");

  const fechaAnterior = new Date(fechaCitaMorning);
  const fechaSiguiente = new Date(fechaCitaOriginal);

  // Crear nuevas fechas para no modificar la original
  const diaAnterior = new Date(fechaAnterior);
  diaAnterior.setUTCDate(diaAnterior.getUTCDate() - 1);

  const diaSiguiente = new Date(fechaSiguiente);

  // Función para obtener fecha con hora original
  const getISOConHora = (fechaOriginal, nuevaFecha, sumarHoras = 0) => {
    const fechaTemporal = new Date(nuevaFecha);
    fechaTemporal.setUTCHours(
      fechaOriginal.getUTCHours() + sumarHoras,
      fechaOriginal.getUTCMinutes(),
      fechaOriginal.getUTCSeconds(),
      fechaOriginal.getUTCMilliseconds()
    );
    return fechaTemporal.toISOString();
  };

  return {
    diaAnterior: getISOConHora(fechaAnterior, diaAnterior),
    diaSiguiente: getISOConHora(fechaSiguiente, diaSiguiente, 2), // Sumar una hora
  };
};

export const ajustarFechaGhl = (str) => {
  const date = new Date(str);

  // Obtiene el offset local en minutos (por ejemplo, -240 en UTC-4)
  const tzOffsetMinutes = date.getTimezoneOffset(); // negativo si estás al este de UTC
  const offsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
  const offsetMinutes = Math.abs(tzOffsetMinutes) % 60;

  // Formatea el offset como ±hh:mm
  const offsetSign = tzOffsetMinutes > 0 ? "-" : "+";
  const offsetFormatted = `${offsetSign}${String(offsetHours).padStart(
    2,
    "0"
  )}:${String(offsetMinutes).padStart(2, "0")}`;

  // Extrae las partes de la fecha en tu zona horaria
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Une todo
  const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetFormatted}`;
  return localTimeString;
};

export const actualDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // Mes empieza desde 0
  const dd = String(today.getDate()).padStart(2, "0");

  const formattedDate = `${yyyy}-${mm}-${dd}`;
  return formattedDate;
};

export const verifyEmailPhone = async (persona_selected) => {
  const url = `${servidor}/api/contactDetector/searchPerson`;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({ persona_selected })
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    return data

  } catch (error) {
    console.error('Error en fetch:', error);
  }
};

export const toLosAngelesOffset = (date, time) => {
  // Unimos fecha y hora
  const dateTimeString = `${date} ${time}`; // "2025-09-22 10:12"

  // Creamos el objeto moment en LA
  const laMoment = moment.tz(dateTimeString, "YYYY-MM-DD HH:mm", "America/Los_Angeles");

  // Formato con offset incluido
  return laMoment.format("YYYY-MM-DDTHH:mm:ssZ");
}

export const obtainWeek = () => {

  const today = moment().utc();

  // Inicio de semana (lunes)
  const startOfWeek = today.clone().startOf('isoWeek').toISOString();

  // Fin de semana (domingo)
  const endOfWeek = today.clone().endOf('isoWeek').toISOString();

  return { start: startOfWeek, end: endOfWeek }
}
