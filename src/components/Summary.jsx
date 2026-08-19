import React, { useEffect, useState } from "react";
import {
  obtainHomes,
  getCaptacionPeopleMongo,
  searchAppointmentFUB,
  getDealTransaction,
  putStage,
  putTask,
  searchAppointmentMongoDb,
  getAppointmentMongo,
} from "../config/funciones";
import {
  ajustarFechaUtcModify,
  formatearFecha,
  formatearFechaSplit,
  formatUsd,
} from "../config/utils";
import { toast } from "react-toastify";
import CardDeals from "./CardDeals";
import Loading from "./Loading";
import FilasSummary from "./FilasSummary";
import ListarCitas from "./ListarCitas";
import { useAppContext } from "../context/AppContext";
import ProgressBar from "../components/Follow/ProgressBar";

//Componente reutilizable
function SummaryCard({ title, children, variant = "default" }) {
  return (
    <section className={`summary-card summary-card--${variant}`}>
      {title && <h6 className="summary-card__title">{title}</h6>}
      <div className="summary-card__body">{children}</div>
    </section>
  );
}

export default function Summary({ personFilter, getApptFub, getLastCita }) {
  const [loading, setLoading] = useState(true);
  const [filterPerson, setFilterPerson] = useState();
  const [apptFub, setApptFub] = useState([]);
  const [lastCita, setLastCita] = useState();
  const [showCitas, setShowCitas] = useState(false);
  const [key, setKey] = useState(0);
  const [dataDebt, setDataDebt] = useState();
  const { person, context, isLoading, error } = useAppContext();
  const [deals, setDeals] = useState(null);
  const [dataDebsReady, setDataDebsReady] = useState(false);
  const [lastApptMongo, setLastApptMongo] = useState(null);

  //Estados Btn de los Task
  const [btnTaskCall, setBtnTaskCall] = useState(false);
  const [btnThankYouCall, setBtnThankYouCall] = useState(false);

  const resetApp = () => {
    setKey((prevKey) => prevKey + 1); // Cambiar la key fuerza un remount
  };

  useEffect(() => {
    if (context?.user?.id) {
      const fetchAppointmentData = async () => {
        setLoading(true);
        if (!context?.person) return;

        try {
          const appointments = await searchAppointmentFUB(context.person.id);

          if (appointments?.success) {
            setApptFub(appointments.data);
            if (appointments.data.length > 0) {
              const apptMongo = await getAppointmentMongo(
                appointments.data[0]?.id,
              );

              if (apptMongo) {
                setLastApptMongo(apptMongo);
              }
            }
          }

          getApptFub(appointments.data || []);

          const dataDb = await obtainHomes(Number(context.person.id));

          if (dataDb?.success) {
            setDataDebt(dataDb.data);
          }
        } catch (err) {
          console.log(err);
        } finally {
          setLoading(false);
          setDataDebsReady(true);
        }
      };
      fetchAppointmentData();
    }
  }, [context?.user?.id, context?.person]);

  useEffect(() => {
    if (personFilter && apptFub.length > 0) {
      setFilterPerson(personFilter);
      console.log(personFilter);
      if (personFilter?.citas?.length > 0) {
        const existCitaAppt = personFilter.citas.find(
          (item) => item.appointmentId === apptFub[0].id,
        );

        if (existCitaAppt) {
          setLastCita(existCitaAppt);
        }
      }
    }
  }, [personFilter, apptFub]);

  const getIcon = (key, value) => {
    switch (key) {
      case "Lead Type":
        return value === "Undeined"
          ? "⛔ "
          : value === "Refinance"
            ? "🔔 "
            : "✅ ";
      case "Stage":
        return value === "DECIDED TO QUIT"
          ? "⛔ "
          : value === "APPT DIDN´T GO" ||
              value === "APPT DIDN´T APPROVE//DIDN´T SIGN"
            ? "🔔 "
            : "✅ ";
      case "Other Problem":
        return "⛔ ";
      case "Attemps":
        return value === "1 DAY ATTEMPT" || value === "2 DAY ATTEMPT"
          ? "✅ "
          : value === "3 DAY ATTEMPT" ||
              value === "4 DAY ATTEMPT" ||
              value === "5 DAY ATTEMPT"
            ? "🔔 "
            : "⛔ ";
      case "Contact Future":
        return value === "Yes" ? "✅ " : value === "No" ? "⛔ " : "🔔 ";
      case "Cita":
        return value === "Yes" ? "✅ " : value === "No" ? "⛔ " : "🔔 ";
      case "Pipeline":
        return value !== "Waiting for Appointment Day" ? "✅ " : "🔔 ";
      case "Debt Problem":
        return value === "Debt-NonRemovable:"
          ? "⛔ "
          : value === "Debt-AttemptingToEliminate:"
            ? "🔔 "
            : "✅ ";
      case true:
        return "⛔ ";
      default:
        return "✅";
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getCaptacionPeopleMongo(context.person.id);
      setFilterPerson(response);
      if (response?.citas?.length > 0)
        setLastCita(response?.citas[response?.citas?.length - 1]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (context) fetchData();
  }, [context?.person?.id]);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const deal = await getDealTransaction(person.id);

        if (deal.success) {
          const first = deal.data.filter((item) =>
            item.pipelineName.includes("TRANSACTION"),
          );

          setDeals(first);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (person?.id) {
      fetchDeal();
    }
  }, [person?.id]);

  function getClassAppt() {
    let clase = "";
    if (apptFub.length > 0 && apptFub[0]?.id === lastCita?.appointmentId) {
      switch (lastCita?.attendance) {
        case "Waiting for Appt date":
          clase = "bg-yellow-suave";
          break;
        case "Appt Attended":
          if (
            lastCita?.results === "Client Qualified" ||
            lastCita?.results === "Client Signed"
          ) {
            clase = "bg-green-suave";
          } else {
            if (lastCita?.results === "Client Pending Action") {
              clase = "bg-yellow-suave";
            } else {
              clase = "bg-orange-suave";
            }
          }
          break;
        case "Appt NOT Attended":
          clase = "bg-orange-suave";
          break;

        default:
          clase = "bg-primary";
          break;
      }
    } else {
      clase = "bg-primary text-white";
    }
    return clase;
  }

  const handleDelete = async (clave, id) => {
    if (!clave || !id) return;
    if (clave === "customVANextContactDay3M") {
      setBtnTaskCall(true);
    }
    if (clave === "customVAPromiseToCallOrApptReminder") {
      setBtnThankYouCall(true);
    }
    try {
      const data = {
        personId: person.id,
        [clave]: null,
      };
      const put_stage = await putStage(data);
      if (put_stage.success) {
        toast.success("People actualizada", {
          position: "top-right",
          autoClose: 2000,
        });
      }
      const dataTask = {
        taskId: id,
        isCompleted: true,
      };
      const put_Task = await putTask(dataTask);
      if (put_Task.success) {
        toast.success("Task actualizada", {
          position: "top-right",
          autoClose: 2000,
        });
      }
      setTimeout(() => {
        window.location.reload();
      }, 2000); // 3000 ms = 3 segundos
    } catch (error) {
      console.log(error);
      toast.error("Ocurrió un error al actualizar", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  function processPastClient() {
    if (!deals?.length) return null;
    if (!person?.tags?.includes("PAST CLIENT")) return null;

    const filterDeals = deals.filter((item) =>
      item?.stageName?.toLowerCase().includes("closed"),
    );

    if (!filterDeals.length) return null;

    const buyerClosed = filterDeals.filter((item) =>
      item?.stageName?.toLowerCase().includes("buyer closed"),
    );

    const sellerClosed = filterDeals.filter((item) =>
      item?.stageName?.toLowerCase().includes("seller closed"),
    );

    return (
      <SummaryCard title="PAST CLIENT">
        <div className="past-client-grid">
          <div className="past-client-box">
            <span className="past-client-label">Buyer</span>
            <strong>{buyerClosed.length}</strong>
          </div>

          <div className="past-client-box">
            <span className="past-client-label">Seller</span>
            <strong>{sellerClosed.length}</strong>
          </div>
        </div>

        <FilasSummary
          label="Past Client Type"
          valor={person?.customVAPASTCLIENTTAGSFOLLOWUP}
        />
      </SummaryCard>
    );
  }

  function processClienDetails() {
    if (!deals) return null;

    /*
      customPARealtorRecruitment: person?.customPARealtorRecruitment,
        customPAActiveRealtor: person?.customPAActiveRealtor,
         */

    return (
      <SummaryCard title="Client Details">
        <FilasSummary label="Language" valor={person?.customClientLanguage} />
        <FilasSummary label="Lead Type" valor={person?.customNEWLeadType} />
        <FilasSummary label="Pipeline" valor={person?.customNEWPIPELINE} />
        <FilasSummary label="Stage" valor={person.stage} />
        <FilasSummary
          label="Ready Buy/Sell"
          valor={person?.customVaClientSignedReadyToBuyOrSell}
        />

        {filterPerson?.leadType !== "Seller" && (
          <FilasSummary
            label="Legal Status"
            valor={person?.customNEWClientSQualifyAs}
          />
        )}

        {person?.customVAAMPMTimeToCall &&
          person?.customVAAMPM2ndTimeToCall && (
            <FilasSummary
              label="Best Time To Call"
              valor={
                "From " +
                person?.customVAAMPMTimeToCall?.split("-")[1] +
                " To " +
                person?.customVAAMPM2ndTimeToCall?.split("-")[1]
              }
            />
          )}

        <FilasSummary
          label="Best Days To Call"
          valor={person?.customBestDaysToCall?.replaceAll("-", " ")}
        />
        <FilasSummary label="Realtor Recruitment Phase" valor={person?.customPARealtorRecruitmentPhase} />
        <FilasSummary label="Realtor Recruitment" valor={person?.customPARealtorRecruitment} />
        <FilasSummary label="Active Realtor" valor={person?.customPAActiveRealtor} />
      </SummaryCard>
    );
  }

  function processAttemps() {
    const hasFollowUp =
      person?.customVAClientActiveOrInactive ||
      person?.customVAClientFollowUp ||
      person?.customVANOANSWERATTEMPTS;

    if (!hasFollowUp) return null;

    return (
      <SummaryCard title="CLIENT FOLLOW UP">
        <div className="followup-grid">
          <div className="followup-pill">
            <small>Status</small>
            <strong>{person?.customVAClientActiveOrInactive || "-"}</strong>
          </div>

          <div className="followup-pill">
            <small>Type</small>
            <strong>{person?.customVAClientFollowUp || "-"}</strong>
          </div>

          <div className="followup-pill">
            <small>Attempts</small>
            <strong>{person?.customVANOANSWERATTEMPTS || "-"}</strong>
          </div>
        </div>
      </SummaryCard>
    );
  }

  function processTasks() {
    const hasTaskCall =
      personFilter?.taskCall && person?.customVANextContactDay3M;
    const hasThankYouTask =
      personFilter?.taskThankYou && person?.customVAPromiseToCallOrApptReminder;

    if (!hasTaskCall && !hasThankYouTask) return null;

    return (
      <SummaryCard title="TASKS">
        {hasTaskCall && (
          <div className="compact-task">
            <div className="compact-task__header">
              <span>
                <i className="bi bi-telephone-fill text-success me-1"></i>
                Next Contact Day
              </span>

              <i
                className={`bi ${
                  btnTaskCall
                    ? "bi-check-square-fill text-primary"
                    : "bi-square"
                } icon-complete`}
                title="Complete"
                onClick={() =>
                  handleDelete(
                    "customVANextContactDay3M",
                    personFilter?.taskCall?.id,
                  )
                }
              ></i>
            </div>

            <div className="compact-task__note">
              {personFilter?.taskCall?.name}
            </div>

            <FilasSummary
              label="Due"
              valor={
                person?.customVANextContactDay3M
                  ? ajustarFechaUtcModify(personFilter?.taskCall?.dueDateTime)
                  : ""
              }
            />

            <details className="task-more-details">
              <summary>More details</summary>
              <FilasSummary
                label="Created"
                valor={formatearFecha(personFilter?.taskCall?.created)}
              />
            </details>
          </div>
        )}

        {hasThankYouTask && (
          <div className="compact-task">
            <div className="compact-task__header">
              <span>
                <i className="bi bi-heart-fill text-danger me-1"></i>
                Promise To Call
              </span>

              <i
                className={`bi ${
                  btnThankYouCall
                    ? "bi-check-square-fill text-primary"
                    : "bi-square"
                } icon-complete`}
                title="Complete"
                onClick={() =>
                  handleDelete(
                    "customVAPromiseToCallOrApptReminder",
                    personFilter?.taskThankYou?.id,
                  )
                }
              ></i>
            </div>

            <div className="compact-task__note">
              {personFilter?.taskThankYou?.name}
            </div>

            <FilasSummary
              label="Due"
              valor={
                person?.customVAPromiseToCallOrApptReminder
                  ? ajustarFechaUtcModify(
                      personFilter?.taskThankYou?.dueDateTime,
                    )
                  : ""
              }
            />

            <details className="task-more-details">
              <summary>More details</summary>
              <FilasSummary
                label="Created"
                valor={formatearFecha(personFilter?.taskThankYou?.created)}
              />
            </details>
          </div>
        )}
      </SummaryCard>
    );
  }

  function processDeals() {
    if (!deals?.length) return null;

    return (
      <SummaryCard title={`DEALS (${deals.length})`}>
        <details>
          <summary>View Deals ({deals.length})</summary>

          {deals.map((item, index) => (
            <CardDeals key={index} item={item} />
          ))}
        </details>
      </SummaryCard>
    );
  }

  function processProblems() {
    if (!filterPerson?.problems?.length) return null;

    return (
      <SummaryCard title="CLIENT MAIN PROBLEM">
        <FilasSummary label="Debt Problem" valor={filterPerson.debtProblem} />

        <div className="problem-tags">
          {filterPerson.problems.map((item, index) => (
            <span className="problem-tag" key={index}>
              {item.includes("Other")
                ? person?.customNEWProblemOther || "Other"
                : item.split("-")[1]}
            </span>
          ))}
        </div>
      </SummaryCard>
    );
  }

  function processLastApptStatus() {
    if (apptFub.length === 0) return null;

    const currentAppt = apptFub[0];
    const hasMongoStatus = currentAppt?.id === lastCita?.appointmentId;

    const attendance = hasMongoStatus
      ? lastCita?.attendance
      : "Waiting for Appt Date";

    const meetingWith = hasMongoStatus
      ? lastCita?.realtorOrLenderName
      : lastApptMongo?.realtorLenderValue || "";

    return (
      <SummaryCard title="LAST APPT STATUS">
        <div className="appt-status-grid">
          <FilasSummary
            label="Date"
            valor={ajustarFechaUtcModify(currentAppt?.start)}
          />
          <FilasSummary label="With" valor={meetingWith} />
          <FilasSummary label="Attendance" valor={currentAppt?.outcome} />

          {hasMongoStatus && lastCita?.attendance === "Appt Attended" && (
            <FilasSummary label="Result" valor={lastCita?.results} />
          )}

          {/*
          {hasMongoStatus && lastCita?.pending && (
            <FilasSummary label="Follow Up" valor={lastCita?.pending} />
          )}

          {hasMongoStatus && lastCita?.datePending && (
            <FilasSummary label="Follow Up Date" valor={ajustarFechaUtcModify(lastCita?.datePending)} />
          )}
           */}
        </div>

        <details className="appt-more-details">
          <summary>More appointment details</summary>

          <FilasSummary label="Name" valor={currentAppt?.title} />
          <FilasSummary
            label="Location"
            valor={person?.customNEWApptLocation}
          />
          <FilasSummary
            label="Classification"
            valor={person?.customNEWApptClassification}
          />
          <FilasSummary label="Type" valor={currentAppt?.type} />

          {hasMongoStatus && lastCita?.attendance === "Appt NOT Attended" && (
            <>
              <FilasSummary
                label="No Show Reason"
                valor={lastCita?.typeProblems}
              />
              <FilasSummary
                label={lastCita?.typeProblems}
                valor={lastCita?.problem}
              />
            </>
          )}

          {/*
          {hasMongoStatus && lastCita?.created && (
            <FilasSummary label="Follow Up Created" valor={ajustarFechaUtcModify(lastCita?.created)} />
          )}
           */}
        </details>

        {person?.stage?.toLowerCase().includes("4- decided to quit") && (
          <div className="compact-quit-box">
            <h6>Client Quit Details</h6>
            <FilasSummary label="Phase" valor={personFilter.whyIsOut} />
            <FilasSummary
              label="Date"
              valor={formatearFecha(
                new Date(
                  personFilter.whenIsOut?.slice(0, 10) + "T06:00:00" || "",
                ),
              )}
            />
            <FilasSummary
              label="Reason"
              valor={personFilter.whyIsOutReasonSpecific}
            />
          </div>
        )}
      </SummaryCard>
    );
  }

  function processOtherApptDetails() {
    if (personFilter?.citas?.length === 0) return null;

    return (
      <SummaryCard>
        <button
          type="button"
          className="appointment-toggle"
          onClick={() => setShowCitas(!showCitas)}
        >
          <span>Appointment History</span>
          <span>{personFilter?.citas?.length || 0} records</span>
          <i
            className={`bi ${showCitas ? "bi-chevron-up" : "bi-chevron-down"}`}
          />
        </button>

        {showCitas && (
          <ListarCitas context={context} citas={personFilter.citas} />
        )}
      </SummaryCard>
    );
  }

  function processAffordabilitiData() {
    if (!personFilter?.dataDebs) return null;

    return (
      <SummaryCard title="CLIENT AFFORDABILITY">
        <div className="affordability-grid">
          <div className="affordability-box">
            <small>With Debt</small>
            <strong>{formatUsd(personFilter?.dataDebs?.withDebt)}</strong>
          </div>

          <div className="affordability-box">
            <small>Without Debt</small>
            <strong>{formatUsd(personFilter?.dataDebs?.withoutDebt)}</strong>
          </div>
        </div>
      </SummaryCard>
    );
  }

  if (loading) {
    return <Loading text="Loading Summary..." />;
  }

  function ExecutiveSummary() {
    return (
      <SummaryCard>
        <div className="executive-summary">
          <div>
            <h5 className="executive-summary__name">
              {person?.firstName} {person?.lastName}
            </h5>
            <div className="executive-summary__meta">
              {person?.customNEWLeadType} · {person?.customClientLanguage} ·{" "}
              {person?.customNEWClientSQualifyAs}
            </div>
          </div>

          <div className="executive-summary__badges">
            <span className="badge bg-warning text-dark">
              {person?.customNEWPIPELINE}
            </span>
            <span className="badge bg-primary">{person?.stage}</span>
          </div>
        </div>
      </SummaryCard>
    );
  }

  return (
    <div className="w-100 m-auto p-1 summary-compact">
      {filterPerson ? (
        <>
          {processClienDetails()}

          {processLastApptStatus()}

          {processTasks()}

          {!dataDebt &&
            dataDebsReady &&
            personFilter?.leadType?.toLowerCase().includes("buyer") &&
            (personFilter?.pipeline === "2- Income or Address Info – No Appt" ||
              personFilter?.pipeline === "3- Waiting for Appointment Day" ||
              personFilter?.pipeline === "4- Appointment Outcome" ||
              personFilter?.pipeline === "5- VA Follow-Up with Realtor") && (
              <div className="compact-alert compact-alert--danger">
                Use Mortgage Calculator
              </div>
            )}

          {processProblems()}

          {processAffordabilitiData()}

          {processDeals()}

          {processAttemps()}

          {processPastClient()}

          {processOtherApptDetails()}
        </>
      ) : (
        <>
          <div className="compact-alert compact-alert--danger">
            Fill Data Entry
          </div>

          {processClienDetails()}
          {processDeals()}
        </>
      )}
    </div>
  );
}
//context=eyJjb250ZXh0IjoicGVyc29uIiwiYWNjb3VudCI6eyJpZCI6MjExNDI1NTIwMywiZG9tYWluIjoiaG9tZWxhc3ZlZ2FzbmV2YWRhIiwib3duZXIiOnsibmFtZSI6Ikp1YW4gQ2FybG9zIENhcnJlcmEiLCJlbWFpbCI6ImhvbWVsYXN2ZWdhc25ldmFkYUBnbWFpbC5jb20ifX0sInVzZXIiOnsiaWQiOjEwMCwibmFtZSI6Ikd1c3Rhdm8gTGVvbiIsImVtYWlsIjoiZXN0cmVsbGFnbG05NkBnbWFpbC5jb20ifSwicGVyc29uIjp7ImlkIjo1MTk3OSwiZmlyc3ROYW1lIjoiUmF1bCIsImxhc3ROYW1lIjoiQ2VydmFudGVzIiwicGhvbmVzIjpbeyJ2YWx1ZSI6IjU1OTc4ODgwMzciLCJ0eXBlIjoibW9iaWxlIiwic3RhdHVzIjoiVmFsaWQiLCJpc1ByaW1hcnkiOjEsIm5vcm1hbGl6ZWQiOiI1NTk3ODg4MDM3IiwicmVsYXRpb25zaGlwSWQiOjAsImlzTGFuZGxpbmUiOmZhbHNlfV0sImVtYWlscyI6W3sidmFsdWUiOiJnLnJhdWxjQHlhaG9vLmNvbSIsInR5cGUiOiJob21lIiwic3RhdHVzIjoiVmFsaWQiLCJpc1ByaW1hcnkiOjEsInJlbGF0aW9uc2hpcElkIjowfV0sInN0YWdlIjp7ImlkIjo0NjMsIm5hbWUiOiIxLSBMRUFEIE5PIEFOU1dFUiAqIn19fQ
