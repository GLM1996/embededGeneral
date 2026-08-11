import React, { useState, useEffect, useRef } from "react";
import moment from "moment-timezone";
import {
  searchAppointmentOutcomeFUB,
  searchAppointmentTypeOutcomeFUB,
  addAppointment,
  searchPersonUser,
  editAppointment,
  getChoicesCustomFields,
  addAppointmentMongoDb,
  saveAppointment,
  getAppointmentMongo,
  postTask,
  putStage,
  saveAppointmentMongoCaptacionV2,
  sendDataN8N,
  buildDataN8N,
  createNote,
  updatePeople,
} from "../../config/funciones";
import {
  ajustarFecha,
  formatearFecha,
  convertTo24Hour,
  ajustarFechaGhl,
  obtenerFechasVecinas,
  actualDate,
  obtainWeek,
  servidor,
} from "../../config/utils";
import { Time } from "../../config/Select";
import { toast } from "react-toastify";
import { useAppContext } from "../../context/AppContext";
import { CustomFieldsNewAppt } from "../../config/CustomFields";
import { useDebounce } from "../../hooks/useDebonce";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Loading from "../utils/Loading";
import { servidor_n8n } from "../../config/utils";
import ErrorModal from "../ErrorModal";

export default function NewAppontment({ data, lastAppt, appointmentMongo }) {
  const { person, context, isLoading, error, relationship } = useAppContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [invitees, setInvitees] = useState([]);
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState("");
  const [location, setLocation] = useState("");
  const [invitation, setInvitation] = useState(false);
  const [verifyFreeSlots, setVerifyFreeSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [query, setQuery] = useState("");
  const [availableTime, setAvailableTime] = useState(Time);
  const [choices, setShoices] = useState([]);
  const [clientQualify, setClientQualify] = useState("");
  const [leadType, setLeadType] = useState("");
  const [language, setLanguage] = useState("ES");
  const [outcome, setOutcome] = useState(108);
  const [typeOutcome, setTypeOutcome] = useState("");
  const [typeOutcomeFUB, setTypeOutcomeFUB] = useState([]);
  const [typeOutcomeFUBFilter, setTypeOutcomeFUBFilter] = useState([]);
  const [outcomeFUB, setOutcomeFUB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [dataEdit, setDataEdit] = useState(data);
  const [dataRealtorLender, setDataRealtorLender] = useState([]);
  const [dataRealtorLenderCopy, setDataRealtorLenderCopy] = useState([]);
  const [realtorLender, setRealtorLender] = useState("");
  const [realtorLenderValue, setRealtorLenderValue] = useState("");
  const [ready, setReady] = useState(false);
  const [typeCita, setTypeCita] = useState("");
  const [whereCita, setWhereCita] = useState("");
  const [statusBtn, setStatusBtn] = useState(false);
  const [errorN8N, setErrorN8N] = useState("");
  const [numSmsGhl, setNumSmsGhl] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [statusSearchSlots, setStatusSearchSlots] = useState(false);
  // Opcional: Usamos useRef para evitar que cambios futuros afecten
  const contextRef = useRef(context);
  const isCreateMode = data === "Data";
  const isEditMode = data !== "Data" && !!data;
  const skipNextRealtorLenderResetRef = useRef(false);
  const prevRealtorLenderRef = useRef("");
  const [numbersFilters, setNumbersFilters] = useState([]);
  const [monto, setMonto] = useState(0);
  const [address, setAddress] = useState("")
  const [lastSource, setLastSource] = useState("");
  const [campaing, setCampaing] = useState("");
  const [itemMongo, setItemMongo] = useState({});
  const [verify, setVerify] = useState(true);
  const [forzarCita, setForzarCita] = useState(false)
  const [proccessAppt, setProccessAppt] = useState({ status: false, error: false, msg: "If an error occurs, please report it via Zoho to the Embedded Group." })
  // 👇 monto con debounce (espera 500ms después de que el usuario deja de escribir)
  const debouncedMonto = useDebounce(monto, 500);
  const [sendMessages, setSendMessages] = useState("Yes")
  const [tipo, setTipo] = useState("");

  const [realtorsFilteredBK, setRealtorsFilteredBackup] = useState([])
  const [lendersFilteredBK, setLendersFilteredBackup] = useState([])
  const [showInviteeError, setShowInviteeError] = useState(false)

  const [errorValidate, setErrorValidate] = useState({ title: "", content: "" })

  useEffect(() => {
    const context = contextRef.current;
    if (!context?.user) return;

    const fetchAppointmentData = async () => {
      if (data === "Data") {
        filtrarContext(context);
      }
      try {
        const [outcomes, typeOutcome, dataAppt] = await Promise.all([
          searchAppointmentOutcomeFUB(),
          searchAppointmentTypeOutcomeFUB(),
          getChoicesCustomFields(CustomFieldsNewAppt),
        ]);

        if (outcomes.success) {

          const filterOutcomes = outcomes.data.filter(item =>
            !/\d/.test(item.name)
          );
          setOutcomeFUB(filterOutcomes);
        }
        if (typeOutcome.success) {
          setTypeOutcomeFUB(typeOutcome.data);
          setTypeOutcomeFUBFilter(typeOutcome.data);
        }
        if (dataAppt.success) {
          setShoices(dataAppt.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Puedes agregar manejo de errores adicional aquí
      }
    };
    person?.phones.map((phone) => {
      if (phone.type === "GHL") {
        setNumSmsGhl(phone.normalized);
      }
    });
    setCollaborators(person?.collaborators.map((item) => item.id));
    setAddress(person?.customVAClientHomeAddress || "")

    fetchAppointmentData();
  }, []); // Añade las dependencias necesarias

  useEffect(() => {
    if (choices?.length > 0 && person) {
      // En edición no pisamos campos que ya vienen de FUB/Mongo.
      setLanguage(person?.customClientLanguage || "");
      setLeadType(person?.customNEWLeadType || "");
      setClientQualify(person?.customNEWClientSQualifyAs || "");
      setLastSource(person?.customVALastLeadSource || "");
      setCampaing(person?.customVACampaing || "");
    }
  }, [choices, person]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(query);
    }, 500); // Espera 500ms tras la última tecla

    return () => clearTimeout(delayDebounce); // Limpia el timeout anterior
  }, [query]);

  //TRAE EL APPOINTMENT DESDE MONGO DB
  const fetchDataMongo = async () => {
    const apptMongo = await getAppointmentMongo(data.id);
    return apptMongo;
  };

  //FORMATEA LA FECHA ISO Y LA DIVIDE EN Ej: 2025-04-17 Y 09:00 PM
  function formatDateTime(isoString) {
    // 1. Parsear la fecha en UTC y convertir a Pacific Time (PST/PDT automático)
    const datePT = moment.utc(isoString).tz("America/Los_Angeles");

    // 2. Formatear fecha (YYYY-MM-DD)
    const formattedDate = datePT.format("YYYY-MM-DD");

    // 3. Formatear hora en 12h con AM/PM (ej: "09:30 PM")
    const formattedTime = datePT.format("hh:mm A");

    return {
      date: formattedDate, // Ejemplo: "2025-04-17"
      time: formattedTime, // Ejemplo: "09:00 PM"
    };
  }

  useEffect(() => {
    const initialize = async () => {
      if (data !== "Data" && data) {
        //await veryfiCalendarFreeSlots()

        setLoading(true);
        setTitle(data.title);
        setDescription(data.description);
        setInvitees(data.invitees);
        setAllDay(data.allDay);
        setLocation(data.location);
        setOutcome(data.outcomeId || "");
        setTypeOutcome(data.typeId || "");
        setStartDate(formatDateTime(data.start).date);
        setEndDate(formatDateTime(data.end || data.start).date);
        setStartTime(formatDateTime(data.start).time);
        setEndTime(formatDateTime(data.end || data.start).time);

        skipNextRealtorLenderResetRef.current = true;
        const result = await fetchDataMongo();
        const itemMongo = result[0]
        if (itemMongo) {
          setItemMongo(itemMongo);
          setRealtorLender(itemMongo?.realtorLender || "");
          setRealtorLenderValue(itemMongo?.realtorLenderValue || "");
          setWhereCita(itemMongo?.whereAppt || "");
          setTypeCita(itemMongo?.typeAppt || "");
          setTipo(itemMongo?.realtorLenderValue ? "yes" : "no");
          setLastSource(
            itemMongo?.lastSource || person?.customVALastLeadSource || ""
          );
          setCampaing(itemMongo?.campaing || person?.customVACampaing || "");
        }

        setReady(true); // <- Aquí marcamos que ya está listo para mostrar el componente
      }
      setLoading(false);
    };
    initialize();
  }, [data]);


  //Filtra los realtor y lender segun Sheet de Monto, Idioma y Otros
  useEffect(() => {
    const fetchData = async () => {
      if (!realtorLender) {
        setDataRealtorLender([]);
        return;
      }

      const preserveEditValues = isEditMode && skipNextRealtorLenderResetRef.current;
      const realtorLenderChanged = prevRealtorLenderRef.current !== realtorLender;

      setStatusSearchSlots(true);

      // En creación, o cuando el usuario cambia manualmente Meeting With, sí se limpian
      // los campos dependientes. Durante la hidratación de edición NO se limpian,
      // porque eso dejaba Realtor/Lender en EMPTY.
      // Cambios de Appt Phase solo recargan opciones, no limpian el nombre ya seleccionado.
      if (!preserveEditValues && realtorLenderChanged) {
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
        setForzarCita(false);
        setRealtorLenderValue("");
        setAvailableSlots([]);
        setAvailableTime(Time);
      }

      try {
        if (realtorLender === "REALTOR") {
          setStatusBtn(false);
          const filterRealtor = await filterRealtorBySheet();          
          setDataRealtorLender(filterRealtor || []);
          return;
        }
        

        if (realtorLender === "LENDER") {
          const dataLender = await getChoicesCustomFields([
            { id: 165, clave: "", choices: [] },
          ]);

          const actualLenders = [...(dataLender?.data?.[0]?.choices || [])];
          setDataRealtorLenderCopy(actualLenders);

          if (typeCita === "1ST APPT") {
            const weekFilter = obtainWeek();

            try {
              const url = `${servidor}/api/appts/getByDateRange?startDate=${weekFilter.start}&endDate=${weekFilter.end}`;
              const option = {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              };
              const response = await fetch(url, option);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const result = await response.json();
              const filterResult = (result?.data || []).filter(
                (item) => item.typeAppt === "1ST APPT"
              );

              if (filterResult.length > 0) {
                const frecuencia = filterResult.reduce((acc, obj) => {
                  acc[obj.realtorLenderValue] =
                    (acc[obj.realtorLenderValue] || 0) + 1;
                  return acc;
                }, {});

                const filtrados = actualLenders.filter(
                  (lender) => (frecuencia[lender] || 0) < 6
                );

                setDataRealtorLender(filtrados);
              } else {
                setDataRealtorLender(actualLenders);
              }
            } catch (error) {
              console.log(error);
              setDataRealtorLender(actualLenders);
            }
          } else {
            setDataRealtorLender(actualLenders);
          }
        }
      } catch (error) {
        console.error("Error fetching Realtor/Lender data:", error);
        setDataRealtorLender([]);
      } finally {
        skipNextRealtorLenderResetRef.current = false;
        prevRealtorLenderRef.current = realtorLender;
        setStatusSearchSlots(false);
      }
    };

    fetchData();
  }, [realtorLender, typeCita]);

  //Automatizacion se encarga de filtrar con los calendarios
  useEffect(() => {
    if (!realtorLenderValue) {
      setAvailableTime(Time);
    }
    if (
      (startDate && realtorLenderValue && whereCita) ||
      (startDate && realtorLender && startTime && whereCita)
    ) {
      veryfiCalendarFreeSlots();
      setVerify(false);
    } else {
      setAvailableSlots([]);
      console.log("datos insuficientes");
    }
  }, [startDate, startTime]);

  //Automatizacion que busca en follow up boss el realtorLenderName y lo agrega a los invitees
  useEffect(() => {
    if (realtorLenderValue && data === "Data") {
      handleSearchAutomathic(realtorLenderValue);
    }
  }, [realtorLenderValue]);

  //Se encarga de resetear a valores vacios la fecha y la hora
  useEffect(() => {
    // En edición no se debe borrar la fecha/hora al hidratar desde Mongo/FUB.
    // Solo limpiamos en creación cuando cambian campos dependientes y no hay hora elegida.
    if (!startTime && isCreateMode) {
      setStartDate("");
      setStartTime("");
    }
  }, [realtorLenderValue, whereCita, startTime, isCreateMode])

  //OBTIENE TODOS LOS NUMEROS DEL PERFIL
  const filtrarNumerosNames = () => {
    //obtener los numeros de las relaciones
    const resultado = [];

    if (relationship.length > 0) {
      relationship.forEach((rel) => {
        if (rel?.phones) {
          rel.phones.forEach((phone) => {
            resultado.push({
              name: rel.name,
              number: phone.normalized,
            });
          });
        }
      });
    }
    if (person?.phones?.length > 0) {
      person.phones.forEach((phone) => {
        // Verifica si el número ya existe en resultado
        const existe = resultado.some(
          (item) => item.number === phone.normalized
        );
        if (!existe) {
          resultado.push({
            name: person.name,
            number: phone.normalized,
          });
        }
      });
    }
    setNumbersFilters(resultado);
    // return resultado
  };

  //Se encarga de agregar los numeros de las relaciones del cliente
  useEffect(() => {
    if (relationship) {
      filtrarNumerosNames();
    }
  }, [relationship]);

  //SE ENCARGA DE REALIZAR LA BUSQUEDA PARA EL CAMPO ADD QUEST
  const handleSearch = async (value) => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchPersonUser(value);
      console.log(res)
      setResults(res);
    } catch (err) {
      console.error("Error buscando:", err);
    } finally {
      setLoading(false);
    }
  };

  //SE ENCARGA DE REALIZAR LA BUSQUEDA DEL REALTOR NAME EN FOLLOW UP BOSS AUTOMATICA CUANDO SE SELLECIONA UN REALTORLENDER NAME
  const handleSearchAutomathic = async (value) => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await searchPersonUser(value);
      console.log(res,value)
      if (res?.length) {
        const person = res[0];
        const alreadyExists = invitees.some(
          invitee => invitee.userId === person.id
        );
        if (alreadyExists) return;

        handleItem(person);
      }
    } catch (err) {
      console.error("Error buscando:", err);
    }
  };

  //SE ENCARGA DE CAMBIAR EL REALTOR LENDER VALUE Y SETEAR A "" LA HORA PARA QUE SE VUELVA A BUSCAR LA DISPONIBILIDAD DE GHL
  const hanldeRealtorLenderValue = (value) => {
    setRealtorLenderValue(value);
    //setStartTime("");
  };

  //SE ENCARGA DE CAMBIAR LA CITA DE PHONE-OFFICE Y SETEAR A "" LA HORA PARA QUE SE VUELVA A BUSCAR LA DISPONIBILIDAD DE GHL
  const hanldeTypeCita = (value) => {
    setWhereCita(value);
    //setStartTime("");
  };

  //AGREGA EL REALTOR LENDER NAME QUE SE BUSCA AUTOMATICO A LA SECCION DE INVITEES
  const handleItem = async (item) => {
    // Verificamos si el item ya está en la lista (por su id, correo, nombre, etc.)
    const alreadyExists = invitees.some((inv) => inv.id === item.id); // ajusta según tu estructura
    const existCollaborators = collaborators.some(
      (coll) => coll.id === item.id
    );

    if (alreadyExists) return; // No lo añadimos si ya existe
    let data = {};
    if (item.role) {
      data = {
        userId: item.id,
        personId: null,
        relationshipId: null,
        name: item.name,
        email:
          item.emails?.length > 0
            ? item.emails.find((e) => e.isPrimary === 1)?.value
            : null,
      };
    } else {
      data = {
        userId: null,
        personId: item.id,
        relationshipId: null,
        name: item.name,
        email:
          item.emails?.length > 0
            ? item.emails.find((e) => e.isPrimary === 1)?.value
            : null,
      };
    }
    setInvitees((prev) => [...prev, data]); // Añadimos el item
    if (realtorLender === "REALTOR" && !existCollaborators) {
      setCollaborators((prev) => [...prev, item.id]);
    }
    setQuery(""); // Limpiamos el input de búsqueda
    setResults([]); // Limpiamos los resultados
  };

  //SE ENCARGA DE REMOVER UN INVITES DEL APPOINTMENT
  const handleRemoveInvitee = (item) => {
    if (item.personId) {
      setInvitees((prev) => prev.filter((i) => i.personId !== item.personId));
    } else {
      if (item.userId) {
        setInvitees((prev) => prev.filter((i) => i.userId !== item.userId));
      }
    }
  };

  //SEGUN EL CONTEXT QUE VIENE POR PARAMETROS SETEA LOS DOS INVITES POR DEFECTO
  const filtrarContext = (context) => {
    const user = {
      userId: context.user.id,
      personId: null,
      relationshipId: null,
      name: context.user.name,
      email: context.user.email,
    };
    const person = {
      userId: null,
      personId: context.person.id,
      relationshipId: null,
      name: context.person.firstName + " " + context.person.lastName,
      email:
        context.person.emails.length > 0
          ? context.person.emails.find((e) => e.isPrimary === 1)?.value
          : null,
    };
    setInvitees([user, person]);
  };

  //SE CONECTA AL CALENDAR DE GHL PARA CHECKEAR LA DISPONIBILIDAD DEL REALTOR O LENDER
  const veryfiCalendarFreeSlots = async () => {
    // Inicio del día en America/Los_Angeles
    const startDateTime = moment.tz(`${startDate}T00:00:00`, 'America/Los_Angeles').valueOf();

    // Fin del día en America/Los_Angeles
    const finalEndDate = endDate || startDate;
    const endDateTime = moment.tz(`${finalEndDate}T23:59:59.999`, 'America/Los_Angeles').valueOf();

    // Toma los dos primeros nombres/apellidos
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

    setStatusSearchSlots(true);

    if (realtorLenderValue && whereCita && startDate && !startTime) //  || verify
    {
      setVerifyFreeSlots(true);

      const parts = realtorLenderValue.trim().split(" ");

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

      let nameCalendar = shortName + "-" + filter;

      if (leadType === "Personal Rent") {
        nameCalendar = "RENTA JUAN CARLOS"
      }

      try {
        const urlNew =
          `${servidor_n8n}/webhook/5fd00b45-df51-49a7-8a0c-c1bfc13a1237`;
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
          },
          //Eddie-Morales-Phone
          body: JSON.stringify({
            calendarName: nameCalendar,
            startDate: startDateTime,
            endDate: endDateTime,
            start: startDate,
          }),
        };

        const response = await fetch(urlNew, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message || `HTTP error! status: ${response.status}`;
          console.error(errorMessage);
          return [];
        }

        const result = await response.json().catch(() => ({}));
        console.log(result);

        if (result[0].horas) {
          const horas24 = result[0].horas;
          const horas12 = horas24.map((hora) => {
            const [hhStr, mm] = hora.split(":");
            let hh = parseInt(hhStr, 10);
            const ampm = hh >= 12 ? "PM" : "AM";
            hh = hh % 12;
            if (hh === 0) hh = 12;

            return `${hh.toString().padStart(2, "0")}:${mm} ${ampm}`;
          });
          if (verify && data !== 'Data') horas12.push(formatDateTime(data.start).time);
          setAvailableTime(horas12);
          setAvailableSlots(horas12);
        } else {
          setAvailableSlots([]);
        }
        return result;
      } catch (error) {
        console.error("Fetch error:", error);
        return [];
      } finally {
        setVerifyFreeSlots(false);
        setStatusSearchSlots(false);
      }
    } else {
      if (
        realtorLender &&
        whereCita &&
        startDate &&
        startTime &&
        !realtorLenderValue
      ) {
        setVerifyFreeSlots(true);
        const calendarNameList = [];
        if (realtorLender === "LENDER") {
          dataRealtorLenderCopy.map((item) => {
            const parts = item.trim().split(" ");
            const shortName = `${parts[0]}-${parts[1]}`;
            const nameCalendar = shortName + "-" + filter;
            calendarNameList.push(nameCalendar);
          });
        } else {
          realtorsFilteredBK.map((item) => {
            const parts = item.trim().split(" ");
            const shortName = `${parts[0]}-${parts[1]}`;
            const nameCalendar = shortName + "-" + filter;
            calendarNameList.push(nameCalendar);
          });
        }
        const timetoCompare = convertTo24Hour(startTime);
        try {
          const urlNew =
            `${servidor_n8n}/webhook/aed81a3d-e329-4ff4-9945-72681b9267f6`;
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
            },
            //Eddie-Morales-Phone
            body: JSON.stringify({
              calendarNameList: calendarNameList,
              startDate: startDateTime,
              endDate: endDateTime,
              start: startDate,
            }),
          };
          const response = await fetch(urlNew, options);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              errorData.message || `HTTP error! status: ${response.status}`;
            console.error(errorMessage);
            return [];
          }
          const result = await response.json().catch(() => ({}));

          if (result?.length > 0) {
            // Filtrar solo calendarios con hora '11:00'
            const filtered = result?.filter((cal) =>
              cal.horas.includes(timetoCompare)
            );

            const nombres = filtered.map((cal) => {
              // 1. Dividir la cadena por el guion '-'
              const partes = cal.calendarName.split('-');

              // 2. Tomar solo los primeros dos elementos (Nombre y Apellido)
              const nombreApellidoArray = partes.slice(0, 2);

              // Unir los elementos: Nombre Apellido
              const nombreApellido = nombreApellidoArray.join(' ');

              // 3. Agregar el sufijo condicionalmente y filtrar por los datos correspondientes
              if (realtorLender === 'LENDER') {
                console.log(dataRealtorLenderCopy,nombreApellido)
                // Buscar en dataRealtorLenderCopy que incluya el nombreApellido
                const found = dataRealtorLenderCopy.find(item =>
                  item && item.includes(nombreApellido)
                );
               
                return found ? found : nombreApellido + ' (Lender)';
              } else if (realtorLender === 'REALTOR') {
                // Buscar en realtorFilteredBK que incluya el nombreApellido
                const found = realtorsFilteredBK.find(item =>
                  item && item.includes(nombreApellido)
                );
                return found ? found : nombreApellido + ' (Realtor)';
              }
            });
            setAvailableSlots(nombres);
            setDataRealtorLender(nombres)
          } else {
            setAvailableSlots([]);
          }
          return result;
        } catch (error) {
          console.error("Fetch error:", error);
          setAvailableSlots([]);
          return [];
        } finally {
          setVerifyFreeSlots(false);
          setStatusSearchSlots(false);
        }
      }
    }
    setVerify(false);
    setStatusSearchSlots(false);
  };

  //FUNCION PRINCIPALQUE SE ENCARGA DE SALVAR LA DATA Y CORRER LAS AUTOMATIZACIONES PERTINENTES
  const handleSave = async () => {

    if (isCreateMode && invitees.length !== 3) {
      setErrorValidate({
        title: "Appointment Validation Error",
        content: "This appointment must contain exactly 3 invitees. The appointment received from Follow Up Boss contains a different number of invitees."
      })
      setShowInviteeError(true)
      // toast.warning(`Appointment validation failed: expected 3 invitees, but received ${invitees.length} from Follow Up Boss.`, {
      //   autoClose: false,
      // });
      return
    }

    setStatusBtn(true);
    setProccessAppt({ status: true })

    //toast.warning("Procesando informacion espere...", { autoClose: 5000 })
    const fechaStartDate = ajustarFecha(startDate, startTime, zonaHoraria);
    const fechaEndDate = ajustarFecha(endDate, endTime, zonaHoraria);
    const startGhl = ajustarFechaGhl(fechaStartDate);
    const endGhl = ajustarFechaGhl(fechaEndDate);
    const parts = realtorLenderValue?.trim().split(" ") || [];

    // Toma los dos primeros nombres/apellidos
    const shortName = `${parts[0] || ""}-${parts[1] || ""}`;
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

    if (data === 'Data') {
      const dataInvites = [...invitees];
      const addresses = [...person?.addresses || []]
      /*----------------------------------VERSION CON n8n--------------------------------------- */
      const fechaVecinas = obtenerFechasVecinas(startDate, startTime);

      const updatedPhones = (person?.phones || []).map((phone) =>
        phone.normalized === numSmsGhl
          ? { ...phone, type: "GHL" }
          : { ...phone, type: "Mobile" }
      );
      const dataJson = {
        stage: "3- APPT Created / Waiting Appt Day *",
        customNEWPIPELINE: "3- Waiting for Appt Day",
        //customVAPromiseToCallOrApptReminder: fechaStartDate || "",
        customVAApptFollow: fechaStartDate || "",
        customNEWLeadType: leadType || "",
        customNEWClientSQualifyAs: clientQualify || "",
        customClientLanguage: language || "",
        customNEWApptLocation: whereCita || "",
        customNEWApptClassification: typeCita || "",
        phones: updatedPhones,
        customVALastLeadSource: lastSource || "",
        customVACampaing: campaing || "",
        customVAClientHomeAddress: address || ""
      };

      //CONDICIONES PARA SPLIT COMISION//
      if (
        !person?.customRCommissionSplitAssignedDate &&
        !person?.customRRealtorAssignedForSplitCommission &&
        !person?.customRRealtorSOILeadRefferalLeadCompanyLead &&
        context?.user?.name !== realtorLenderValue
      ) {

        //context?.user?.name
        if (realtorLender === "REALTOR") {
          dataJson.customRRealtorAssignedForSplitCommission =
            realtorLenderValue;
          dataJson.customRCommissionSplitAssignedDate = actualDate();

          if (leadType === "Buyer") {
            dataJson.customRLeadOwnerSplitType = "(CL) 20/80 Company Qualified Lead"
          } else {
            if (leadType === "Seller") {
              dataJson.customRLeadOwnerSplitType = "(CL) 20/80 Company Qualified Lead"

            }
          }
          dataJson.customRRealtorSOILeadRefferalLeadCompanyLead =
            "Company Lead";
        }
      } else {
        if (
          realtorLender === "REALTOR" &&
          !person?.customRCommissionSplitAssignedDate &&
          !person?.customRRealtorAssignedForSplitCommission
        ) {
          dataJson.customRRealtorAssignedForSplitCommission =
            realtorLenderValue;
          dataJson.customRCommissionSplitAssignedDate = actualDate();
        }
      }
      //CONDICIONES PARA SPLIT COMISION//
      if (realtorLender === "REALTOR") {
        dataJson.collaborators = collaborators;
      }

      if (realtorLender === "LENDER") {
        dataJson.customVALenderWithClientLastAppt = realtorLenderValue;
        dataJson.assignedLenderName = realtorLenderValue || "";
      } else {
        if (realtorLender === "REALTOR") {
          dataJson.customVARealtorUsedInLastAppt = realtorLenderValue;
        }
      }

      //data split comision
      const dataSplitComision = {
        personCreated: person.created.split("T")[0],
        enlace: `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`,
        fechaAsignado: person.customRCommissionSplitAssignedDate
          ? person.customRCommissionSplitAssignedDate
          : actualDate(),
        leadSplit: "(CL) 20/80 Company Qualified Lead",
        fechaUpdated: actualDate(),
        customRRealtorAssignedForSplitCommission: context.user.name
      }

      //Automatizacion Darnelly 
      if (leadType === "Seller" && realtorLenderValue.includes("Pedro Emilio")) {
        dataSplitComision.leadSplit = "20/80 Company Qualified Lead"
      }

      //Toda la data que se envia al n8n ***** Appointment Created/Edited *****
      const dataAll = {
        //Data para New Appt en Fub
        follow: {
          title: title,
          invitees: dataInvites,
          start: fechaStartDate,
          end: fechaEndDate,
          typeId: typeOutcome,
          outcomeId: outcome,
        },
        task: {
          assignedUserId: Number(person.assignedUserId),
          //     name1: 'Appt Reminder Date Before',
          //     name2: 'Appt Reminder Appt Date',
          //     name3: 'Ask For Appt Feedback',
          dueDateTime1: fechaVecinas.diaAnterior,
          dueDateTime2: ajustarFecha(startDate, "08:00 AM"),
          dueDateTime3: fechaVecinas.diaSiguiente,
        },
        people: dataJson,
        goHightLevel: {
          name_calendar: leadType !== "Personal Rent" ? shortName.toLowerCase() + '-' + filter : "RENTA JUAN CARLOS",
          startGhl: startGhl,
          endGhl: endGhl,
          phone: numSmsGhl,
          email: person?.emails?.[0]?.value || '',
          sendMessages: sendMessages || "Yes"
        },
        sheet: {
          vaFub: context?.user?.name
        },
        generales: {
          user: context?.user?.name,
          userId: context?.user?.id,
          personId: person?.id,
          language: language,
          lastSource: lastSource,
          campaing: campaing,
          leadType: leadType,
          clientQualify: clientQualify,
          type: realtorLender,
          realtorLenderName: realtorLenderValue,
          whereCita: whereCita,
          typeCita: typeCita,
          split: person?.customRRealtorSOILeadRefferalLeadCompanyLead || "Company Lead",
          splitType: person?.customRLeadOwnerSplitType || dataJson?.customRLeadOwnerSplitType || ""
        },
        dataSplit: realtorLender === "REALTOR" && !person?.customRRealtorSOILeadRefferalLeadCompanyLead ? dataSplitComision : {}
      }

      //Si se fuerza la cita dejar una NOTA
      if (forzarCita) {
        try {
          const noteData = {
            personId: Number(person.id),
            subject: `Appt forced by ${context.user.name}`,
            body: `Appt forced by <b style="color:red">${context.user.name}</b>`,
            isHtml: true
          };
          await createNote(noteData)
        } catch (error) {
          console.log(error)
        }
      }

      try {
        const url = leadType !== "Personal Rent" ? `${servidor_n8n}/webhook/9f727616-ded2-4a94-a9dc-7ddb21eb5fe8` : `${servidor_n8n}/webhook/47c754ee-e28f-4206-92ce-348fe0ccd35d`
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${ token } `, // Descomenta si necesitas autenticación
          },
          body: JSON.stringify({ dataAll }),
        };
        const response = await fetch(url, options)

        if (!response.ok) {
          setProccessAppt({ status: true, error: `${error.message || error}`, msg: `Tomar ScreenShot del error y enviarlo por ZOHO (APPT EMBEDED)` })
          // toast.error("Tomar ScreenShot del error y enviarlo por ZOHO (APPT EMBEDED): " + error.message || error, {
          //   autoClose: false
          // })
        }
        const result = await response.json()

        if (result.success) {
          //toast.success("Procesado correctamente")
          setStatusBtn(false);
          setProccessAppt({ status: false })
          setTimeout(() => {
            window.location.reload();
          }, 1000); // 1000 milisegundos = 1 segundo
        }
        //throw new Error("Error forzado");

      } catch (error) {
        //console.log(error)
        setProccessAppt({ status: true, error: `${error.message || error}`, msg: `Tomar ScreenShot del error y enviarlo por ZOHO (APPT EMBEDED)` })

        const url = "https://n8n.homelasvegasnevada.com/webhook/52ecc6ca-278e-4f2f-be4c-cd475ec07770"
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${ token } `, // Descomenta si necesitas autenticación
          },
          body: JSON.stringify({ dataAll }),
        };
        await fetch(url, options)
      }

      /*----------------------------------AQUI TERMINA VERSION CON n8n--------------------------------------- */

    } else {
      const dataInvites = [...invitees];

      const dataEdit = {
        title: title,
        description: description,
        invitees: dataInvites,
        allDay: allDay,
        start: fechaStartDate,
        end: fechaEndDate,
        location: location,
        typeId: typeOutcome,
        outcomeId: outcome,
        sendInvitation: invitation,
      };

      const dataEdited = await editAppointment(dataEdit, data.id);

      if (dataEdited.success) {
        // toast.success("Appt Editado correctamente");
        //Actualizar data de Mongo DB
        try {
          const dataDb = {
            personId: context?.person?.id,
            apptId: dataEdited.data.appointment.id,
            userId: context?.user?.id,
            title: title,
            description: description,
            invitees: dataInvites,
            allDay: allDay,
            start: fechaStartDate,
            end: fechaEndDate,
            location: location,
            realtorLender: realtorLender,
            realtorLenderValue: realtorLenderValue,
            typeId: typeOutcome,
            outcomeId: outcome,
            sendInvitation: invitation,
            whereAppt: whereCita,
            typeAppt: typeCita,
            outcome:
              outcome !== ""
                ? outcomeFUB.find((item) => item.id === Number(outcome)).name
                : "",
            lastSource: lastSource,
            campaing: campaing,
          };

          const [dbResult, sheetResult] = await Promise.allSettled([
            addAppointmentMongoDb(dataDb),
            updateGoogleSheets(
              dataEdited.data.appointment,
              "partialUpdate2IDs"
            ),
          ]);

          // if (dbResult.status === "fulfilled") {
          //   // if (dbResult.value.success) {
          //   //   toast.success("Appt editado correctamente en DB");
          //   // } else {
          //   //   toast.error("Error al guardar en DB");
          //   // }
          // } else {
          //   console.error("Error en DB:", dbResult.reason);
          //   toast.error("Fallo guardado en DB");
          // }

          // if (sheetResult.status === "fulfilled") {
          //   toast.success("Google Sheets actualizado correctamente");
          // } else {
          //   console.error("Error en Sheets:", sheetResult.reason);
          //   toast.error("Fallo actualización en Google Sheets");
          // }
        } catch (error) {
          console.error("Error general:", error);
        }

        //Actualizar data de Follow Up Boss si es ultima cita
        //----------VERIFICAR LAST APPT--------------//

        if (data?.id === lastAppt?.id) {
          try {
            const dataJson = {
              personId: context.person.id,
              customNEWApptLocation: whereCita || "",
              customNEWApptClassification: typeCita || "",
              customVALastLeadSource: lastSource || "",
              customVACampaing: campaing || "",
            };

            const put_stage = await putStage(dataJson);
            if (put_stage.success) {
              toast.success("People actualizada", {
                position: "top-right",
                autoClose: 2000,
              });
            }
          } catch (error) {
            console.log(error);
          }
        }
      }
      const apptedited = dataEdited.data.appointment;

      //<<<<<<<<<<<<<<<<<   QUEDA PENDIENTE ACTUALIZAR PEOPLE SI CAMBIA ALGO EN FOLLOW UP BOSS  >>>>>>>>>>>>>>>>>>>
      if (language !== person?.customClientLanguage || leadType !== person?.customNEWLeadType || clientQualify !== person?.customNEWClientSQualifyAs) {
        try {
          const dataPeople = {
            customClientLanguage: language,
            customNEWLeadType: leadType,
            customNEWClientSQualifyAs: clientQualify
          }
          const responsePeople = await updatePeople(person.id, dataPeople)
          if (responsePeople.success) {
            toast.success("People Actualizada")
          }
        } catch (error) {
          console.log(error)
        }
      }
      //<<<<<<<<<<<<<<<<<   QUEDA PENDIENTE ACTUALIZAR PEOPLE SI CAMBIA ALGO EN FOLLOW UP BOSS  >>>>>>>>>>>>>>>>>>>

      const fecha1 = new Date(data.start);
      const fecha2 = new Date(apptedited.start);

      const modifyApptGhl = (realtorLenderValue === itemMongo?.realtorLenderValue) && (fecha1.getTime() !== fecha2.getTime())
      const createApptGhl = (realtorLenderValue !== itemMongo?.realtorLenderValue) || (location !== itemMongo?.whereAppt)

      //Para actualizar la data en GHL
      if (modifyApptGhl || createApptGhl) {
        const dataN8n = {
          goHightLevel: {
            name_calendar: leadType !== "Personal Rent" ? shortName.toLowerCase() + '-' + filter : "RENTA JUAN CARLOS",
            startGhl: startGhl,
            endGhl: endGhl,
            phone: numSmsGhl,
            email: person?.emails?.[0]?.value || '',
            sendMessages: sendMessages || "Yes",
            ghlApptId: itemMongo?.ghlApptId,
            realtorLenderName: realtorLenderValue,
            assignedTo: person.assignedTo
          }
        }
        const urlNew =
          `${servidor_n8n}/webhook/1673c625-6267-43d5-aabe-bffd7a63913a`;
        try {
          // const dataN8n = {
          //   appt: apptedited.id,
          //   personId: person.id,
          //   phone: person?.phones[0]?.normalized,
          //   type: realtorLender,
          // };
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // "Authorization": `Bearer ${token}`, // Descomenta si necesitas autenticación
            },
            //Eddie-Morales-Phone
            body: JSON.stringify(dataN8n),
          };
          await fetch(urlNew, options);
        } catch (error) {
          console.log(error);
        }
      }


      toast.success("Appt editado correctamente");
      // Recargar la página independientemente de los errores
      setStatusBtn(false);
      setTimeout(() => {
        window.location.reload();
      }, 5000); // 1000 milisegundos = 1 segundo
    }

    //********* --------------------------AQUI TERMINA VERSION SIN n8n----------------- ******************/
  };

  //SE ENCARGA DE SETEAR EL START DATE Y END DATE DEL APPT
  const handleStartDate = (e) => {
    setStartDate(e.target.value);
    setEndDate(e.target.value);
  };

  //SE ENCARGA DE SETEAR EL START TIME Y END TIME DEL APPT
  const handleStartTime = (e) => {
    const startTimeValue = e.target.value;
    setStartTime(startTimeValue);
    const index = Time.indexOf(startTimeValue);

    if (index !== Time.length - 1) {
      setEndTime(Time[index + 1]);
    } else {
      setEndTime(Time[Time.length - 1]);
    }
  };

  //ESTA SE USA PARA CUANDO SE VA A LLENAR LA SHEET
  const getRealtorLenderValues = () => {
    if (realtorLender === "REALTOR") {
      return [" ", realtorLenderValue];
    }
    return [realtorLenderValue, " "];
  };

  //SE ENCARGA DE ACTUALIZAR O CREAR UNA ROW EN LA SHEET Analisis 2 Embeded
  const updateGoogleSheets = async (appointment, mode) => {
    const userName = appointment.invitees.find(
      (item) => item.userId === appointment.createdById
    )?.name;

    const values = [
      formatearFecha(new Date(person.created)), // Creación del cliente
      formatearFecha(new Date()), // Update del cliente
      person.name || "Test", // Name del cliente
      `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`, // Link del cliente
      context.user.name || userName, // Updated By
      userName || person?.assignedTo || context?.user?.name || "", // VA del cliente
      person.stage || "", // Stage
      appointment.typeId || "", // Type Id
      appointment.type || "", // Type
      ...getRealtorLenderValues(),
      formatearFecha(new Date(appointment.created)), // Appt Created
      formatearFecha(new Date(appointment.start)), // Appt Met
    ];
    for (let i = 0; i < 12; i++) {
      values.push("");
    }

    values.push(appointment.outcome);
    values.push(realtorLender);

    for (let i = 0; i < 9; i++) {
      values.push("");
    }
    values.push(whereCita);
    values.push(typeCita);
    for (let i = 0; i < 7; i++) {
      values.push("");
    }
    values.push(lastSource);
    values.push(campaing);

    const data = {
      id1: person.id,
      id2: appointment?.id,
      mode: mode,
      values,
    };

    const put_appointment = await saveAppointment(data);
    if (put_appointment.success) {
      toast.success("Sheet Actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      toast.error("Sheet No Actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  //SE ENCARGA DE FILTRAR LOS REALTORS DISPONIBLES DESDE UNA SHEET QUE PUEDEN AGENDAR UNA CITA SEGUN SUS CONDICIONES
  const filterRealtorBySheet = async () => {
    let realtorsFiltered = [];
    if (realtorsFilteredBK.length > 0) {
      return realtorsFilteredBK
    }
    try {
      //Juan carlo script
      //https://script.google.com/macros/s/AKfycbxrqY1IKQeRPzl7V-LZXCQa2WBinkyqbnEIeJyRpIncXuoId8Th7czoE6JHZeG2uJru/exec
      const response = await fetch(
        //"https://script.google.com/macros/s/AKfycbz5bvtmn_lvisPAKb_bbqnBy8bmHqz9Ras5CBYUQFtPRl69uz2mSRyq5g14JRvfWHqT/exec"
        "https://script.google.com/macros/s/AKfycbxrqY1IKQeRPzl7V-LZXCQa2WBinkyqbnEIeJyRpIncXuoId8Th7czoE6JHZeG2uJru/exec"
      );
      const dataSheet = await response.json();
     
      //Availables
      realtorsFiltered = dataSheet.filter((item) => item[12] === 1);
      //Atienden English
      if (language === "English") {
        realtorsFiltered = realtorsFiltered.filter((item) => item[3] === 1);
      }
      //Atienden Spanish
      if (language === "Spanish") {
        realtorsFiltered = realtorsFiltered.filter((item) => item[4] === 1);
      }

      if (leadType === "Buyer") {
        realtorsFiltered = realtorsFiltered.filter((item) => item[9] === 1);
      }

      if (leadType === "Seller") {
        realtorsFiltered = realtorsFiltered.filter((item) => item[10] === 1);
      }

      if (leadType === "Buyer && Seller") {
        realtorsFiltered = realtorsFiltered.filter((item) => item[11] === 1);
      }

      if (debouncedMonto) {
        if (debouncedMonto < 300000) {
          realtorsFiltered = realtorsFiltered.filter((item) => item[5] === 1);
        } else if (debouncedMonto >= 300000 && debouncedMonto < 400000) {
          realtorsFiltered = realtorsFiltered.filter((item) => item[6] === 1);
        } else if (debouncedMonto >= 400000 && debouncedMonto < 500000) {
          realtorsFiltered = realtorsFiltered.filter((item) => item[7] === 1);
        } else if (debouncedMonto >= 500000) {
          realtorsFiltered = realtorsFiltered.filter((item) => item[8] === 1);
        }
      }

      if (realtorsFiltered.length > 1) {
        realtorsFiltered.sort((a, b) => a[13] - b[13]);
      }

      realtorsFiltered = realtorsFiltered.map((item) => item[1]);
   
      setRealtorsFilteredBackup(realtorsFiltered)
    } catch (error) {
      console.log(error);
    }
    return realtorsFiltered;
  };

  //SE ENCARGA DE GESTIONAR LAS OPCIONES SEGUN SI ES LENDER O REALTOR
  const handleRealtorOrLender = async (valor) => {
    if (!valor) {
      setRealtorLender("");
      setDataRealtorLender([]);
      setRealtorLenderValue("");
      return;
    }

    if (valor.includes("REALTOR")) {
      setRealtorLender("REALTOR");
      return;
    }

    if (valor.includes("LENDER")) {
      setRealtorLender("LENDER");
      return;
    }

    setDataRealtorLender([]);
  };

  //MUESTRA LOADING HASTA SE CARGEN LAS CHOICES
  if (choices.length === 0) {
    return (
      <div className="d-flex justify-content-center">
        <b className="p-4">Loading data...</b>
      </div>
    );
  }

  const resetData = () => {
    setStartDate("")
    setStartTime("")
    setRealtorLenderValue("")
    setForzarCita(false)
  }

  const onChangeForzarCita = async () => {
    setForzarCita(!forzarCita)

    if (!forzarCita) {
      setAvailableTime(Time)
      if (realtorLender === 'LENDER') {
        try {
          const dataLender = await getChoicesCustomFields([
            { id: 165, clave: "", choices: [] },
          ]);

          if (dataLender?.data?.[0]?.choices) {
            const actualLenders = [...(dataLender?.data?.[0]?.choices || [])];
            setDataRealtorLender(dataLender.data[0].choices);
          } else {
            setDataRealtorLender([]);
          }
        } catch (error) {
          console.error("Error fetching Lender data:", error);
          setDataRealtorLender([]);
        }
      } else {
        if (realtorLender === "REALTOR") {
          setDataRealtorLender(realtorsFilteredBK)
        }
      }
    } else {
      resetData()
      //setRealtorLender("")
    }
  }

  const availableLeadType = ["Buyer", "Seller", "Buyer & Seller", "Personal Rent", "Refi"]

  // Si estamos editando y el valor guardado todavía no llegó en las opciones,
  // lo inyectamos temporalmente para evitar que el select muestre EMPTY.
 
  const realtorLenderOptions = realtorLenderValue &&
    !dataRealtorLender.some((item) => item === realtorLenderValue)
    ? [realtorLenderValue, ...dataRealtorLender]
    : dataRealtorLender;

  return (
    <>
      {proccessAppt.status && (
        <Loading msg={proccessAppt.msg} error={proccessAppt.error} />
      )}
      <form
        className="row w-100 m-auto bg-info p-0 was-validated"
        lang="en"
        onSubmit={(e) => {
          e.preventDefault(); // 👈 Evita la recarga
          handleSave(); // 👈 Tu función
        }}
      >
        <b className="text-center fs-5 mb-1">
          {data === "Data" ? "Create Appointment" : "Edit Appointment"}
        </b>
        {/* Language */}
        <div className="col-12">
          <b>Language</b>
          <select
            className="form-select form-select-sm"
            aria-label="Lead type select"
            value={language || ""}
            onChange={(e) => setLanguage(e.target.value)}
            required
          >
            <option value="">EMPTY</option>
            <option disabled>----------</option>
            <option value="Spanish">Spanish</option>
            <option value="English">English</option>
          </select>
        </div>
        {/* Lead Type */}
        {language && (
          <div className="col-12">
            <b>Lead Type</b>
            <select
              className="form-select form-select-sm"
              aria-label="Lead type select"
              name="Type"
              value={leadType}
              onChange={(e) => setLeadType(e.target.value)}
              required
            >
              <option value="">EMPTY</option>
              <option disabled>----------</option>
              {choices[0].choices.map((option, index) => {
                if (!availableLeadType.includes(option)) {
                  return null;
                } else {
                  return (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  );
                }
              })}
            </select>
          </div>
        )}
        {/* Legal Status */}
        {leadType !== "Seller" && leadType && (
          <div className="col-12">
            <b>Legal Status</b>
            <select
              className="form-select form-select-sm"
              aria-label="Lead type select"
              value={clientQualify || ""}
              onChange={(e) => setClientQualify(e.target.value)}
              required
            >
              <option value="">EMPTY</option>
              <option disabled>----------</option>
              {choices[1].choices.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Tipo de Cita */}
        {leadType !== "Personal Rent" && leadType && (
          <>
            <div className="col-12 mb-1">
              <b>Appt Phase</b>
              <select
                className="form-select form-select-sm"
                aria-label="Lead type select"
                value={typeCita}
                onChange={(e) => setTypeCita(e.target.value)}
                required
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>
                {choices[2].choices.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 mb-1">
              <b>Appt Location</b>
              <select
                className="form-select form-select-sm"
                aria-label="Lead type select"
                value={whereCita}
                onChange={(e) => hanldeTypeCita(e.target.value)}
                required
                disabled={statusSearchSlots}
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>

                {choices[3].choices.map((option, index) => {
                  if (realtorLender === "LENDER" && index === 2) return null;
                  return (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  );
                })}
              </select>
            </div>
          </>
        )}
        {/* Donde es la Cita de Renta */}
        {
          leadType === "Personal Rent" && (
            <div className="col-12 mb-1">
              <b>Appt Location</b>
              <select
                className="form-select form-select-sm"
                aria-label="Lead type select"
                value={whereCita}
                onChange={(e) => hanldeTypeCita(e.target.value)}
                required
                disabled={statusSearchSlots}
              >
                <option value="">EMPTY</option>
                <option disabled>----------</option>

                {choices[4].choices.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )
        }
        {/* Address */}
        {leadType.includes("Seller") && realtorLender === "REALTOR" && (
          <div className="col-6">
            <b>Seller address</b>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="address"
              aria-label="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required={whereCita.includes("Address")}
            />
          </div>
        )}
        {/* Monto */}
        {realtorLender === "REALTOR" && (
          <div className="col-12" hidden>
            <b>Estimated Home Value</b>
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="Monto"
              aria-label="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        )}
        {/* Meeting Lender o Realtor */}
        {leadType && (
          <div className="col-12">
            <b>Meeting with</b>
            <select
              className="form-select form-select-sm"
              aria-label="Lead type select"
              value={realtorLender || ""}
              onChange={(e) => handleRealtorOrLender(e.target.value)}
              required
              disabled={statusSearchSlots}
            >
              <option value="">EMPTY</option>
              <option disabled>----------</option>
              <option value="REALTOR">REALTOR</option>
              {leadType !== "Personal Rent" ? <option value="LENDER">LENDER</option> : null}
            </select>
          </div>
        )}

        {realtorLender && (
          <>
            {/* Nueva division del proceso de Cita */}
            <div className="col-12 border border-bottom border-2 border-black m-2"></div>
            <div className="text-center">
              <strong>Search By Specific Date or Lender/Realtor</strong>
            </div>
            <div className="d-flex justify-content-center gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipo"
                  id="radio1"
                  value="no"
                  checked={tipo === "no"}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    if (data === "Data") { resetData() }
                  }}
                />
                <label className="form-check-label text-black" htmlFor="radio1">
                  Specific Date
                </label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input text-black"
                  type="radio"
                  name="tipo"
                  id="radio2"
                  value="yes"
                  checked={tipo === "yes"}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    if (data === "Data") {
                      resetData()
                      setDataRealtorLender(
                        realtorLender === "REALTOR"
                          ? realtorsFilteredBK
                          : realtorLender === "LENDER"
                            ? dataRealtorLenderCopy
                            : []
                      );
                    }
                  }}
                />
                <label className="form-check-label text-black" htmlFor="radio2">
                  Lender/Realtor
                </label>
              </div>
            </div>
            {/* Cuando la cita sea con nombre Lender Realtor*/}
            {tipo === "yes" && (
              <>
                {/* Nombre del Lender o del Realtor */}
                <div className="col-12 ">
                  <b>Name of Realtor/Lenter </b>
                  <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={realtorLenderValue || ""}
                    onChange={(e) => hanldeRealtorLenderValue(e.target.value)}
                    required
                    disabled={statusSearchSlots || (realtorLenderValue && startDate && startTime && !forzarCita) && isCreateMode}
                  >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {/* You might want to populate this dynamically */}
                    {realtorLenderOptions.map((item, index) => {
                      if (leadType === "Personal Rent") {
                        if (item.includes("Juan Carlos Carrera")) {
                          return (
                            <option key={index + 1} value={item}>
                              {item}
                            </option>
                          );
                        }
                        return null;
                      }
                      return (
                        <option key={index + 1} value={item}>
                          {item}
                        </option>
                      );

                    })}
                  </select>
                </div>
                {/* start */}
                {realtorLenderValue && (
                  <>
                    <div className="col-12 d-flex gap-1 mt-1">
                      <div className="input-group input-group-sm">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={startDate}
                          onChange={(e) => handleStartDate(e)}
                          required
                          disabled={(statusSearchSlots || (realtorLenderValue && startDate && startTime && !forzarCita) || !whereCita)}
                        />
                      </div>
                      <div className="input-group input-group-sm">
                        <select
                          className="form-select form-select-sm"
                          aria-label="Pipelines select"
                          value={startTime}
                          onChange={(e) => handleStartTime(e)}
                          required
                          disabled={(statusSearchSlots || (realtorLenderValue && startDate && startTime && !forzarCita) || !whereCita || !startDate)}
                        >
                          <option value="">EMPTY</option>
                          <option disabled>----------</option>

                          {availableTime.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Forzar Cita */}
                    {startDate && (
                      <div className="col-12 d-flex gap-1">
                        <div className="col-6"></div>
                        <div className="form-check">
                          <input className="form-check-input"
                            type="checkbox"
                            checked={forzarCita}
                            onChange={() => onChangeForzarCita()}
                            id="checkDefault" />
                          <label className="form-check-label">
                            Force Appt // Reset
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* Nombre del Lender o del Realtor */}
                {startDate && realtorLenderValue && (
                  <>
                    {
                      verifyFreeSlots && (
                        <div className="col-12 m-1">
                          <div className="bg-warning d-flex justify-content-center p-1 rounded-1 ">
                            <b>Verifing Slots Wait</b>
                          </div>
                        </div>
                      )
                    }
                    {
                      availableSlots.length === 0 && !verifyFreeSlots && (realtorLenderValue && whereCita && startDate && !startTime) && (
                        <div className="bg-danger d-flex justify-content-center p-1 rounded-1 text-white fw-bold m-1">
                          <b>No Available Slots</b>
                        </div>
                      )
                    }
                    {/* Free Slots */}
                    {
                      availableSlots.length > 0 && !verifyFreeSlots && realtorLenderValue && !(realtorLenderValue && startDate && startTime) && (
                        <div className="col-12 mb-1">
                          <div className="bg-success d-flex justify-content-center p-1 rounded-1 text-white fw-bold ">
                            <b>Available Slots Calendar</b>
                          </div>
                        </div>
                      )
                    }
                  </>
                )}
              </>
            )}
            {/* Cuando la cita sea con fecha y hora */}
            {tipo === "no" && (
              <>
                {/* start */}
                <div className="col-12 d-flex gap-1">
                  <div className="input-group input-group-sm">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={startDate}
                      onChange={(e) => handleStartDate(e)}
                      required
                      disabled={statusSearchSlots || (realtorLenderValue && startDate && startTime && !forzarCita) || !whereCita}
                    />
                  </div>
                  <div className="input-group input-group-sm">
                    <select
                      className="form-select form-select-sm"
                      aria-label="Pipelines select"
                      value={startTime}
                      onChange={(e) => handleStartTime(e)}
                      required
                      disabled={statusSearchSlots || (realtorLenderValue && startDate && startTime && !forzarCita) || !whereCita || !startDate}
                    >
                      <option value="">EMPTY</option>
                      <option disabled>----------</option>

                      {availableTime.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Nombre del Lender o del Realtor */}
                {startDate && startTime && (
                  <>
                    {
                      verifyFreeSlots && (
                        <div className="col-12 m-1">
                          <div className="bg-warning d-flex justify-content-center p-1 rounded-1 ">
                            <b>Verifing Slots Wait</b>
                          </div>
                        </div>
                      )
                    }
                    {
                      availableSlots.length === 0 && !verifyFreeSlots && ((realtorLenderValue && whereCita && startDate && !startTime) ||
                        (realtorLender &&
                          whereCita &&
                          startDate &&
                          startTime &&
                          !realtorLenderValue)) && (
                        <div className="bg-danger d-flex justify-content-center p-1 rounded-1 text-white fw-bold m-1">
                          <b>No Available Slots</b>
                        </div>
                      )
                    }
                    {
                      availableSlots.length > 0 && !verifyFreeSlots && !realtorLenderValue && (
                        <div className="col-12 mb-1">
                          <div className="border rounded-3 p-2 bg-light">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="fw-semibold text-primary small">
                                Available Realtor Calendar
                              </span>

                              <span className="badge bg-primary rounded-pill">
                                {availableSlots.length}
                              </span>
                            </div>

                            <div className="d-flex flex-wrap gap-1">
                              {availableSlots.map((item, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill"
                                  style={{ fontSize: "11px", lineHeight: "20px" }}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    {/* Nombre del Lender o del Realtor */}
                    <div className="col-12 ">
                      <b>Name of Realtor/Lenter </b>
                      <select
                        className="form-select form-select-sm"
                        aria-label="Lead type select"
                        value={realtorLenderValue || ""}
                        onChange={(e) => hanldeRealtorLenderValue(e.target.value)}
                        required
                        disabled={statusSearchSlots || (realtorLenderValue && startDate && startTime && !forzarCita)}
                      >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {/* You might want to populate this dynamically */}
                        {realtorLenderOptions.map((item, index) => {
                          if (leadType === "Personal Rent") {
                            if (item.includes("Juan Carlos Carrera")) {
                              <option key={index + 1} value={item}>
                                {item}
                              </option>
                            }
                            else { return null }
                          }
                          return (
                            <option key={index + 1} value={item}>
                              {item}
                            </option>
                          );

                        })}
                      </select>
                    </div>
                  </>
                )}
                {/* Forzar Cita */}
                {startTime && (
                  <div className="col-12 d-flex gap-1">
                    <div className="col-6"></div>
                    <div className="form-check">
                      <input className="form-check-input"
                        type="checkbox"
                        checked={forzarCita}
                        onChange={() => onChangeForzarCita()}
                        id="checkDefault" />
                      <label className="form-check-label">
                        Force Appt // Reset
                      </label>
                    </div>
                  </div>
                )}
              </>
            )
            }

            {/* typeId */}
            {realtorLenderValue && (
              <div className="col-12">
                <b>Appt With/Where</b>
                <select
                  className="form-select form-select-sm"
                  aria-label="Lead type select"
                  value={typeOutcome}
                  onChange={(e) => setTypeOutcome(e.target.value)}
                  required
                >
                  <option value="">No Type</option>
                  <option disabled>----------</option>
                  {typeOutcomeFUB.map((item, index) => {
                    {/* Filtro para Personal Rent */ }
                    if (leadType === "Personal Rent") {
                      if (item.name.includes(10)) {
                        return (
                          <option key={index + 1} value={item.id}>
                            {item.name}
                          </option>
                        )
                      } else {
                        return null
                      }
                    }
                    {/* Filtro para Realtors */ }
                    if (realtorLender === "REALTOR") {
                      if (item.name.includes("REALTOR") || item.name.includes("FOLLOW") || item.name.includes("PERSONAL")) {
                        return (
                          <option key={index + 1} value={item.id}>
                            {item.name}
                          </option>
                        )
                      } else {
                        return null
                      }
                    }
                    {/* Filtro para Lenders */ }
                    if (realtorLender === "LENDER") {
                      if ((item.name.includes("LENDER") || item.name.includes("FOLLOW")) && !item.name.includes("REALTOR")) {
                        return (
                          <option key={index + 1} value={item.id}>
                            {item.name}
                          </option>
                        )
                      } else {
                        return null
                      }
                    }
                    return (
                      <option key={index + 1} value={item.id}>
                        {item.name}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
            {/* outcomeId */}
            <div className="col-12" hidden={data === "Data"}>
              <b>Outcome (Appt Cycle)</b>
              <select
                className="form-select form-select-sm"
                aria-label="Lead type select"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                required
              >
                {data !== "Data" && data ? (
                  <>
                    <option value="">No Outcome</option>
                    <option disabled>----------</option>
                    {outcomeFUB.map((item, index) => (
                      <option key={index + 1} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option key={1} value={outcomeFUB[0]?.id || ""}>
                    {outcomeFUB[0]?.name || ""}
                  </option>
                )}
              </select>
            </div>
            {/* title */}
            {typeOutcome && (
              <div className="col-12 mt-3">
                <div className="input-group input-group-sm mb-1">
                  <span className="input-group-text" id="basic-addon1">
                    <i className="bi bi-pencil-fill"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

            )}
            {/* invitees // num perfil // send messages */}
            {title && (
              <>
                {/* Invitees */}
                <div className="col-12" >
                  <div className="input-group input-group-sm mb-1">
                    <span className="input-group-text" id="basic-addon1">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add Guest"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  {/* Resultados */}
                  {loading && <div className="bg-light p-2">Searching...</div>}
                  {results.length > 0 && (
                    <ul
                      className="list-group position-absolute w-100"
                      style={{ zIndex: 10 }}
                    >
                      {results.map((item) => (
                        <li
                          key={item.id}
                          value={item.id}
                          className="list-group-item list-group-item-action"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleItem(item)}
                        >
                          {item.name} {/* Cambia a la propiedad correcta */}
                        </li>
                      ))}
                    </ul>
                  )}
                  {invitees.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {invitees.map((item, index) => (
                        <span
                          key={index + 1}
                          className={`badge d-flex align-items-center ${invitees.length === 3 ? "bg-primary" : "bg-danger"}`}
                        >
                          {item.name}
                          <button
                            type="button"
                            className="btn-close btn-close-white btn-sm ms-2"
                            onClick={() => handleRemoveInvitee(item)}
                            aria-label="Remove"
                          ></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Num del Perfil  */}
                <div className="col-12 mb-1">
                  <b>Text messages will be sent to.. </b>
                  <select
                    className="form-select form-select-sm"
                    aria-label="Lead type select"
                    value={numSmsGhl || ""}
                    onChange={(e) => setNumSmsGhl(e.target.value)}
                    required
                  >
                    <option value="">EMPTY</option>
                    <option disabled>----------</option>
                    {/* You might want to populate this dynamically */}
                    {numbersFilters.map((item, index) => {
                      return (
                        <option key={index + 1} value={item?.number}>
                          {item?.number} {item?.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {/* Send Messages */}
                <div className="col-12 mb-1  justify-content-start">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={sendMessages === "Yes"}
                      onChange={(e) =>
                        setSendMessages(e.target.checked ? "Yes" : "No")
                      }
                      id="sendMessages"
                    />
                    <label className="form-check-label text-black" htmlFor="sendMessages">
                      Send Messages ({sendMessages})
                    </label>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {/* SECCION ERROR N8N */}
        {
          errorN8N?.message && (
            <div className="col-12 p-1 bg-danger rounded-1">
              <p>{errorN8N.message}</p>
            </div>
          )
        }
        <div className="col-12 d-flex justify-content-center my-1">
          <button className="btn btn-success" type="submit" disabled={statusBtn || !leadType || !language}>
            <i className="bi bi-floppy me-1"></i>{" "}
            {statusBtn ? "Saving..." : "Save"}
          </button>
        </div>
      </form >
      {/* Para Validar el Error */}
      {showInviteeError && (
        <ErrorModal
          title={errorValidate.title}
          content={errorValidate.content}
          onClose={() => setShowInviteeError(false)}
        />
      )}
    </>
  );
}
