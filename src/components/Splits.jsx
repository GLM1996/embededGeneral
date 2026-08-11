import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { CustomFieldsSplits } from "../config/CustomFields";
import {
  getChoicesCustomFields,
  handleSearchAutomathic,
  putStage,
  createNote,
} from "../config/funciones";
import { toast } from "react-toastify";
import {
  actualDate,
  formatearFechaSplit,
  servidor_n8n,
} from "../config/utils";
import { getCustomFields } from "../config/funciones";
import { CustomSplits } from "../config/CustomFields";

import { followUpSources } from "../config/Campaign";
import { TextField, Autocomplete } from "@mui/material";


// Reusable checkbox item
const CheckItem = ({ checked, onChange, disabled, label }) => (
  <div className="form-check">
    <input
      type="checkbox"
      className="form-check-input"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      id={label}
    />
    <label className="form-check-label fw-semibold" htmlFor={label}>
      {label}
    </label>
  </div>
);

// Reusable field wrapper
const Field = ({ label, children }) => (
  <div className="mb-1">
    <label className="form-label fw-semibold">{label}</label>
    {children}
  </div>
);

export default function Splits({ personFilter }) {
  const { person, context } = useAppContext();

  const [choices, setShoices] = useState([]);
  const [soiLead, setSoiLead] = useState(false);
  const [referalLead, setReferalLead] = useState(false);
  const [companyLead, setCompanyLead] = useState(false);
  const [customLead, setCustomLead] = useState(false);

  const [assignedDate, setAssignedDate] = useState("");
  const [realtorAssignedBuyer, setRealtorAssignedBuyer] = useState("");
  const [realtorAssignedSeller, setRealtorAssignedSeller] = useState("");
  const [splitTypeBuyer, setSplitTypeBuyer] = useState("");
  const [splitTypeSeller, setSplitTypeSeller] = useState("");

  const [statusBtn, setStatusBtn] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState(null);


  const [customSplitValue, setCustomSplitValue] = useState({
    agentSplit: 20,
    companySplit: 80,
  });

  const [listCollaborators, setListCollaborators] = useState([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false);
  const [showCollaborations, setShowCollaborations] = useState(false)

  const [isBuyer, setIsBuyer] = useState(false)
  const [isSeller, setIsSeller] = useState(false)

  const isBroker = context?.user?.role === "Broker";
  const lockLeadType =
    !isBroker && !!person?.customRRealtorSOILeadRefferalLeadCompanyLead;
  const lockSplitType = !isBroker && !!person?.customRLeadOwnerSplitType

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataAppt = await getCustomFields(CustomSplits);
        // const dataCollaborators = await getCollaborators(person?.id);

        // const [dataAppt, dataCollaborators] = await Promise.all([
        //   getCustomFields(CustomSplits),
        //   getCollaborators(person?.id),
        // ]);

        if (dataAppt) setShoices(dataAppt);
        //if (dataCollaborators) setListCollaborators(dataCollaborators);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (choices.length > 0) {
      setRealtorAssignedBuyer(
        person?.customRRealtorAssignedForSplitCommissionBuyer || ""
      );
      setRealtorAssignedSeller(
        person?.customRRealtorAssignedForSplitCommissionSeller || ""
      );
      setSplitTypeBuyer(person?.customRLeadOwnerSplitTypeBuyer || "");
      setSplitTypeSeller(person?.customRLeadOwnerSplitTypeSeller || "");
      setSoiLead(
        person?.customRRealtorSOILeadRefferalLeadCompanyLead === "SOI Lead"
      );
      setReferalLead(
        person?.customRRealtorSOILeadRefferalLeadCompanyLead ===
        "50/50 Refferal Lead"
      );
      setCompanyLead(
        person?.customRRealtorSOILeadRefferalLeadCompanyLead === "Company Lead"
      );
      setCustomLead(
        person?.customRRealtorSOILeadRefferalLeadCompanyLead?.includes(
          "CUSTOM"
        ) || false
      );

      setAssignedDate(
        person?.customRCommissionSplitAssignedDate || actualDate() || ""
      );

      if (person?.customRCustomSplit) {
        const [agentSplit, companySplit] = (
          person?.customRCustomSplit.match(/\d+/g) || []
        )
          .slice(0, 2)
          .map(Number);

        setCustomSplitValue({
          agentSplit: agentSplit ?? 10,
          companySplit: companySplit ?? 90,
        });
      }
    }
  }, [choices]); // eslint-disable-line

  // useEffect(() => {
  //   const fetchCollaborator = async () => {
  //     // prioridad al que tenga valor
  //     const realtor = realtorAssignedBuyer || realtorAssignedSeller;

  //     if (!realtor) return;

  //     const collaborator = await handleSearchAutomathic(realtor);

  //     setNewCollaborator(collaborator ? collaborator.id : null);
  //   };

  //   fetchCollaborator();
  // }, [realtorAssignedBuyer, realtorAssignedSeller]);

  const getCollaborators = async () => {
    try {
      const url =
        "https://n8n.homelasvegasnevada.com/webhook/45570973-2e56-48b8-bd18-233d084b68bb";

      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      };

      const response = await fetch(url, options);

      const data = await response.json();
      const cleanData = data.filter((item) => Object.keys(item).length > 0);
      return cleanData;
    } catch (error) {
      console.log(error);
      return [];
    }
  };
  const procesarColaborador = async () => {
    if (!person?.id || loadingCollaborators || collaboratorsLoaded) return;

    try {
      setLoadingCollaborators(true);

      const dataCollaborators = await getCollaborators();

      setListCollaborators(dataCollaborators || []);
      setCollaboratorsLoaded(true);
    } catch (error) {
      console.error("Error loading collaborators:", error);
      setListCollaborators([]);
      setCollaboratorsLoaded(true);
    } finally {
      setLoadingCollaborators(false);
    }
  };
  function renderColaboradores() {
    // 👉 Ejecutar automáticamente si no están cargados y no está cargando
    if (!collaboratorsLoaded && !loadingCollaborators) {
      procesarColaborador();
    }

    if (loadingCollaborators) {
      return (
        <div className="d-flex justify-content-center align-items-center p-4">
          <span className="spinner-border spinner-border-sm me-2" role="status" />
          <span>Loading Collaborators...</span>
        </div>
      );
    }

    if (!listCollaborators?.length) {
      return (
        <div className="alert alert-danger text-center py-2 mt-1 mb-0" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Collaboration Between Realtors</strong>
          <p className="mb-0 mt-1 small">No Collaboration at this Time</p>
        </div>
      );
    }


    return (
      <div className="row g-1 mb-1 mt-2">
        <div className="d-flex">
          <button
            type="button"
            className="w-100 btn btn-info d-flex align-items-center position-relative"
            onClick={() => setShowCollaborations(!showCollaborations)}
          >
            <span className="w-100 text-center">
              Collaboration History
            </span>

            <i
              style={{ color: "#000", fontWeight: "bold", fontSize: "1.1rem" }}
              className={`bi ${showCollaborations
                ? "bi-chevron-up"
                : "bi-chevron-down"
                } position-absolute end-0 me-2`}
            ></i>
          </button>
        </div>
        {showCollaborations && (
          <div className="fade-in">
            {listCollaborators.some((item) => item.hadCollaboration === "Yes") && (
              <>
                <strong className="d-flex justify-content-center border border-2 border-black rounded-1 bg-light shadow-sm">Collaboration</strong>
                <div className="row g-1">
                  {listCollaborators.filter((item) => item.hadCollaboration === "Yes").map((c, index) => (
                    <div key={index} className="col-12 col-md-6">
                      <div
                        className={`border border-black rounded-2 p-1 my-1 shadow-sm ${c.pendientePago === "Yes" ? "bg-success-subtle" : "bg-danger-subtle"
                          }`}
                      >

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Date
                          </span>
                          <span className="fw-bold">
                            {c.date}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Who Pays
                          </span>
                          <span className="fw-bold">
                            {c.realtorOwner}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Who Receive
                          </span>
                          <span className="fw-bold">
                            {c.collaborationName}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Collaboration Ammount
                          </span>
                          <span className="fw-bold">
                            ${c.collaborationBonus}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Collaboration Type
                          </span>
                          <span className="fw-bold">
                            {c.collaborationType}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Paid
                          </span>
                          <span className="fw-bold">
                            {c.pendientePago || "No"}
                          </span>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {listCollaborators.some((item) => item.hadReassignment === "Yes") && (
              <>
                <strong className="d-flex justify-content-center border border-2 border-black rounded-1 bg-light shadow-sm">Reasignacion</strong>
                <div className="row g-1">
                  {listCollaborators.filter((item) => item.hadReassignment === "Yes").map((c, index) => (
                    <div key={index} className="col-12 col-md-6">
                      <div className="bg-light border border-black my-1 rounded-2 p-1 shadow-sm">

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Date
                          </span>
                          <span className="fw-bold">
                            {c.date}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Who Pays
                          </span>
                          <span className="fw-bold">
                            {c.realtorOwner}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Who Receive
                          </span>
                          <span className="fw-bold">
                            {c.collaborationName}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Reassignation Ammount
                          </span>
                          <span className="fw-bold">
                            {c.collaborationBonus}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between small border-bottom">
                          <span className="text-muted fw-semibold">
                            Split Type
                          </span>
                          <span className="fw-bold">
                            {person?.customRRealtorSOILeadRefferalLeadCompanyLead}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const lastAppt = personFilter?.citas?.length
    ? personFilter.citas[personFilter.citas.length - 1]
    : {};

  const handleSplitCustom = (clave, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value)));

    if (clave === "agentSplit") {
      setCustomSplitValue({
        agentSplit: numValue,
        companySplit: 100 - numValue,
      });
    } else {
      setCustomSplitValue({
        agentSplit: 100 - numValue,
        companySplit: numValue,
      });
    }
  };

  const handleCheck = (clave) => {
    const createdDateFallback = person?.created?.split?.("T")?.[0] || actualDate();

    if (clave === "soiLead") {
      setSoiLead(!soiLead);
      if (!soiLead) {
        setReferalLead(false);
        setCompanyLead(false);
        setCustomLead(false);
        setAssignedDate(actualDate() || createdDateFallback);
        if (isBuyer) {
          setRealtorAssignedBuyer(
            person?.customRRealtorAssignedForSplitCommissionBuyer || person?.assignedTo
          );
          setSplitTypeBuyer("SOI Lead");
        }
        if (isSeller) {
          setRealtorAssignedSeller(
            person?.customRRealtorAssignedForSplitCommissionSeller || person?.assignedTo
          );
          setSplitTypeSeller("SOI Lead");
        }

      }
      return;
    }

    if (clave === "referalLead") {
      setReferalLead(!referalLead);
      if (!referalLead) {
        setSoiLead(false);
        setCompanyLead(false);
        setCustomLead(false);
        setAssignedDate(actualDate() || createdDateFallback);
        setRealtorAssigned(
          person?.customRRealtorAssignedForSplitCommission || person?.assignedTo
        );
        setSplitType("50/50 Company Lead Referral");
      }
      return;
    }

    if (clave === "companyLead") {
      setCompanyLead(!companyLead);
      setSoiLead(false);
      setReferalLead(false);
      setCustomLead(false);
      return;
    }

    if (clave === "customLead") {
      setCustomLead(!customLead);
      setCompanyLead(false);
      setSoiLead(false);
      setReferalLead(false);
    }
  };

  const saveData = async () => {
    if (!isBuyer && !isSeller) {
      toast.warn("Debe seleccionar Buyer or Seller")
      return
    }
    setStatusBtn(true);

    try {
      const dataJson = {
        personId: context.person.id,
        customRCommissionSplitAssignedDate: assignedDate,
        customRRealtorSOILeadRefferalLeadCompanyLead: soiLead
          ? "SOI Lead"
          : companyLead
            ? "Company Lead"
            : "",
        customRCustomSplit: "",
      };

      if (isBuyer) {
        dataJson.customRRealtorAssignedForSplitCommissionBuyer = realtorAssignedBuyer
      }
      if (isSeller) {
        dataJson.customRRealtorAssignedForSplitCommissionSeller = realtorAssignedSeller
      }
      if (!soiLead) {
        if (isBuyer) {
          dataJson.customRLeadOwnerSplitTypeBuyer = splitTypeBuyer
        }
        if (isSeller) {
          dataJson.customRLeadOwnerSplitTypeSeller = splitTypeSeller
        }
      }

      // if (customLead) {
      //   dataJson.customRLeadOwnerSplitType = spliType;
      //   dataJson.customRRealtorSOILeadRefferalLeadCompanyLead = "CUSTOM SPLIT";
      //   dataJson.customRCustomSplit = `${customSplitValue.agentSplit} Agent / ${customSplitValue.companySplit} Company ${spliType}`;
      // }

      if (newCollaborator) {
        const existCollaborators = person.collaborators.some(
          (coll) => coll.id === newCollaborator
        );
        if (!existCollaborators) {
          const collsIds = [
            ...person.collaborators.map((item) => item.id),
            newCollaborator,
          ];
          dataJson.collaborators = collsIds;
        }
      }

      const sheetData = {
        personId: person.id,
        created: formatearFechaSplit(new Date(person.created)),
        link: `https://homelasvegasnevada.followupboss.com/2/people/view/${person.id}`,
        assignedDate: assignedDate,
        realtorBuyer: isBuyer ? realtorAssignedBuyer : "",
        realtorSeller: isSeller ? realtorAssignedSeller : "",
        name: person.name,
        lead: person.customNEWLeadType || "",
        stage: person.stage,
        splitBuyer: isBuyer ? splitTypeBuyer : "",
        splitSeller: isSeller ? splitTypeSeller : "",
        updated: formatearFechaSplit(new Date()),
        updatedBy: context.user.name
      }
      // if (customLead) {
      //   sheetData.values[7] = `${customSplitValue.agentSplit} Agent / ${customSplitValue.companySplit} Company ${spliType}`;
      // }

      let noteText = {}
      let subjectText = {}

      if (isBuyer && isSeller) {
        noteText =
          person.customRLeadOwnerSplitType === null &&
            person.customRRealtorAssignedForSplitCommission === null &&
            person.customRCommissionSplitAssignedDate === null
            ? `<b>${context.user.name}</b> update the split commision to: <br>Split Type Buyer: <b style="color: green">${splitTypeBuyer}</b> 
              <br>Realtor Name Buyer: <b style="color: green">${realtorAssignedBuyer}</b><br><br>
              Split Type Seller: <b style="color: green">${splitTypeSeller}</b> <br>Realtor Name Seller: <b style="color: green">${realtorAssignedSeller}</b> 
              <br><br>Date: <b style="color: green">${assignedDate}</b>`
            : `<b>${context.user.name}</b> update the split commision to: <br>Split Type Buyer: From <b style="color: red">${person.customRLeadOwnerSplitTypeBuyer}</b> 
              To <b style="color: green">${splitTypeBuyer}</b> <br>Realtor Name Buyer: From <b style="color: red">${person.customRRealtorAssignedForSplitCommissionBuyer}</b> 
              To <b style="color: green">${realtorAssignedBuyer}</b><br><br> Split Type Seller: From <b style="color: red">${person.customRLeadOwnerSplitTypeSeller}</b> 
              To <b style="color: green">${splitTypeSeller}</b> <br>Realtor Name Seller: From <b style="color: red">${person.customRRealtorAssignedForSplitCommissionSeller}</b> 
              To <b style="color: green">${realtorAssignedSeller}</b><br><br>Date: From <b style="color: red">${person.customRCommissionSplitAssignedDate}</b> 
              To <b style="color: green">${assignedDate}</b>`;
      } else {
        if (isBuyer && !isSeller) {
          noteText =
            person.customRLeadOwnerSplitType === null &&
              person.customRRealtorAssignedForSplitCommission === null &&
              person.customRCommissionSplitAssignedDate === null
              ? `<b>${context.user.name}</b> update the split commision to: <br>Split Type Buyer: <b style="color: green">${splitTypeBuyer}</b> <br>Realtor Name Buyer: <b style="color: green">${realtorAssignedBuyer}</b> <br>Date: <b style="color: green">${assignedDate}</b>`
              : `<b>${context.user.name}</b> update the split commision to: <br>Split Type Buyer: From <b style="color: red">${person.customRLeadOwnerSplitTypeBuyer}</b> To <b style="color: green">${splitTypeBuyer}</b> <br>Realtor Name Buyer: From <b style="color: red">${person.customRRealtorAssignedForSplitCommissionBuyer}</b> To <b style="color: green">${realtorAssignedBuyer}</b> <br>Date: From <b style="color: red">${person.customRCommissionSplitAssignedDate}</b> To <b style="color: green">${assignedDate}</b>`;
        } else {
          if (!isBuyer && isSeller) {
            noteText =
              person.customRLeadOwnerSplitType === null &&
                person.customRRealtorAssignedForSplitCommission === null &&
                person.customRCommissionSplitAssignedDate === null
                ? `<b>${context.user.name}</b> update the split commision to: <br>Split Type Seller: <b style="color: green">${splitTypeSeller}</b> <br>Realtor Name Buyer: <b style="color: green">${realtorAssignedSeller}</b> <br>Date: <b style="color: green">${assignedDate}</b>`
                : `<b>${context.user.name}</b> update the split commision to: <br>Split Type Seller: From <b style="color: red">${person.customRLeadOwnerSplitTypeSeller}</b> To <b style="color: green">${splitTypeSeller}</b> <br>Realtor Name Seller: From <b style="color: red">${person.customRRealtorAssignedForSplitCommissionSeller}</b> To <b style="color: green">${realtorAssignedSeller}</b> <br>Date: From <b style="color: red">${person.customRCommissionSplitAssignedDate}</b> To <b style="color: green">${assignedDate}</b>`;
          }
        }
      }
      const isFirstAssignment =
        person.customRLeadOwnerSplitTypeBuyer === null &&
        person.customRRealtorAssignedForSplitCommissionBuyer === null &&
        person.customRLeadOwnerSplitTypeSeller === null &&
        person.customRRealtorAssignedForSplitCommissionSeller === null &&
        person.customRCommissionSplitAssignedDate === null;

      if (isBuyer && isSeller) {
        subjectText = isFirstAssignment
          ? `${context.user.name} assigned split commission - Buyer: ${splitTypeBuyer} (${realtorAssignedBuyer}), Seller: ${splitTypeSeller} (${realtorAssignedSeller}), Date: ${assignedDate}`
          : `${context.user.name} changed split commission - Buyer: ${person.customRLeadOwnerSplitTypeBuyer} -> ${splitTypeBuyer} (${person.customRRealtorAssignedForSplitCommissionBuyer} -> ${realtorAssignedBuyer}), Seller: ${person.customRLeadOwnerSplitTypeSeller} -> ${splitTypeSeller} (${person.customRRealtorAssignedForSplitCommissionSeller} -> ${realtorAssignedSeller}), Date: ${person.customRCommissionSplitAssignedDate} -> ${assignedDate}`;
      } else if (isBuyer) {
        subjectText = isFirstAssignment
          ? `${context.user.name} assigned Buyer split commission: ${splitTypeBuyer} (${realtorAssignedBuyer}), Date: ${assignedDate}`
          : `${context.user.name} changed Buyer split commission from ${person.customRLeadOwnerSplitTypeBuyer} to ${splitTypeBuyer} (${person.customRRealtorAssignedForSplitCommissionBuyer} -> ${realtorAssignedBuyer}), Date: ${person.customRCommissionSplitAssignedDate} -> ${assignedDate}`;
      } else if (isSeller) {
        subjectText = isFirstAssignment
          ? `${context.user.name} assigned Seller split commission: ${splitTypeSeller} (${realtorAssignedSeller}), Date: ${assignedDate}`
          : `${context.user.name} changed Seller split commission from ${person.customRLeadOwnerSplitTypeSeller} to ${splitTypeSeller} (${person.customRRealtorAssignedForSplitCommissionSeller} -> ${realtorAssignedSeller}), Date: ${person.customRCommissionSplitAssignedDate} -> ${assignedDate}`;
      }
      const noteData = {
        personId: Number(person.id),
        subject: subjectText,
        body: noteText,
        isHtml: true,
      };
     
      const [putStageResponse, sheetResponse, noteResponse] = await Promise.all([
        putStage(dataJson),
        fetch(`${servidor_n8n}/webhook/1555fb26-883e-4ef9-8f01-f98f0b4fae57`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sheetData),
        }),
        createNote(noteData),
      ]);

      if (!putStageResponse.success) throw new Error("Error al actualizar People");
      if (!sheetResponse.ok) throw new Error("Error al actualizar Sheet");
      if (!noteResponse.success) throw new Error("Error al crear la Nota");

      toast.success("People actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
      toast.success("Sheet Actualizada", {
        position: "top-right",
        autoClose: 2000,
      });
      toast.success("Nota de cambio creada", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error en el flujo de guardado:", error);
      toast.error(`Error: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setStatusBtn(false);
      //window.location.reload();
    }
  };

  const ids = (CustomSplits ?? []).join(",");

  const choicesResp = choices?.data ?? choices ?? [];

  const byId = useCallback(
    (id) => choicesResp.find((f) => f.id === id)?.choices ?? [],
    [choicesResp]
  );

  if (choices.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <span className="spinner-border spinner-border-sm me-2" role="status" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // aquí llamas tu función
        saveData();
      }}
    >
      <div className="container-fluid mt-1 p-2 rounded-2">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            {/* Checks */}
            <p>Client type</p>
            <div className="row g-1 mb-1">
              <div className="col-6 col-md-6">
                <CheckItem
                  checked={soiLead}
                  onChange={() => handleCheck("soiLead")}
                  disabled={lockLeadType}
                  label="SOI Lead"
                />
              </div>

              <div className="col-6 col-md-6">
                <CheckItem
                  checked={companyLead}
                  onChange={() => handleCheck("companyLead")}
                  //disabled={!isBroker}
                  label="Company Lead"
                />
              </div>
            </div>
            <div className="w-100 border border-1 border-black"></div>
            <p>Transaction type</p>
            <div className="row g-1 mb-1">
              <div className="col-6 col-md-6">
                <CheckItem
                  checked={isBuyer}
                  onChange={() => setIsBuyer(!isBuyer)}
                  label="Buyer"
                />
              </div>

              <div className="col-6 col-md-6">
                <CheckItem
                  checked={isSeller}
                  onChange={() => setIsSeller(!isSeller)}
                  label="Seller"
                />
              </div>
            </div>
            <div className="w-100 border border-1 border-black"></div>

            {!soiLead && (
              <>
                {isBuyer && (
                  <div className="border border-1 border-black rounded-1 my-1 p-1 bg-info shadow-sm">
                    <div className="mb-1">
                      <label className="form-label fw-semibold border-bottom border-2 border-black">Select Company Lead Split Buyer</label>
                      <select
                        className="form-select form-select-sm"
                        value={splitTypeBuyer || ""}
                        onChange={(e) => setSplitTypeBuyer(e.target.value)}
                        disabled={lockSplitType}
                        required
                      >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {byId(341)?.map((option, index) => {

                          // filtro por rol                
                          if (!isBroker && !soiLead && (!option.includes("Lead Referral") && !option.includes("Lead Open"))) {
                            return null
                          }

                          if (soiLead && !option.includes("(SOI)")) return null;
                          if (companyLead && !option.includes("(CL)")) return null;
                          if (!soiLead && !companyLead) return null

                          return (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          );
                        })}
                        {isBroker && (
                          <option value="CUSTOM SPLIT">
                            CUSTOM SPLIT
                          </option>
                        )}

                      </select>
                    </div>
                    <div className="mb-1">
                      <label className="form-label fw-semibold border-bottom border-2 border-black">Realtor Assigned for Split Commission Buyer</label>
                      <select
                        className="form-select form-select-sm"
                        value={realtorAssignedBuyer || ""}
                        onChange={(e) => setRealtorAssignedBuyer(e.target.value)}
                        disabled={lockSplitType}
                        required
                      >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {byId(343).map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                )}
                {isSeller && (
                  <div className="border border-1 border-black rounded-1 my-1 p-1 bg-info shadow-sm">
                    <div className="mb-1">
                      <label className="form-label fw-semibold border-bottom border-2 border-black">Select Company Lead Split Seller</label>
                      <select
                        className="form-select form-select-sm"
                        value={splitTypeSeller || ""}
                        onChange={(e) => setSplitTypeSeller(e.target.value)}
                        disabled={lockSplitType}
                        required
                      >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {byId(341)?.map((option, index) => {

                          // filtro por rol                
                          if (!isBroker && !soiLead && (!option.includes("Lead Referral") && !option.includes("Lead Open"))) {
                            return null
                          }

                          if (soiLead && !option.includes("(SOI)")) return null;
                          if (companyLead && !option.includes("(CL)")) return null;
                          if (!soiLead && !companyLead) return null

                          return (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          );
                        })}
                        {isBroker && (
                          <option value="CUSTOM SPLIT">
                            CUSTOM SPLIT
                          </option>
                        )}

                      </select>

                    </div>
                    <div className="mb-1">
                      <label className="form-label fw-semibold border-bottom border-2 border-black">Realtor Assigned for Split Commission Seller</label>
                      <select
                        className="form-select form-select-sm"
                        value={realtorAssignedSeller || ""}
                        onChange={(e) => setRealtorAssignedSeller(e.target.value)}
                        disabled={lockSplitType}
                        required
                      >
                        <option value="">EMPTY</option>
                        <option disabled>----------</option>
                        {byId(343).map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
            {soiLead && (
              <>
                {isBuyer && (
                  <div className="mb-1">
                    <label className="form-label fw-semibold border-bottom border-2 border-black">Realtor Assigned for Split Commission Buyer</label>
                    <select
                      className="form-select form-select-sm"
                      value={realtorAssignedBuyer || ""}
                      onChange={(e) => setRealtorAssignedBuyer(e.target.value)}
                      disabled={lockSplitType}
                      required
                    >
                      <option value="">EMPTY</option>
                      <option disabled>----------</option>
                      {byId(343).map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {isSeller && (
                  <div className="mb-1">
                    <label className="form-label fw-semibold border-bottom border-2 border-black">Realtor Assigned for Split Commission Seller</label>
                    <select
                      className="form-select form-select-sm"
                      value={realtorAssignedSeller || ""}
                      onChange={(e) => setRealtorAssignedSeller(e.target.value)}
                      disabled={lockSplitType}
                      required
                    >
                      <option value="">EMPTY</option>
                      <option disabled>----------</option>
                      {byId(343).map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Fields */}
            <Field label="Commission Split Assigned Date">
              <input
                type="date"
                className="form-control form-control-sm"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                disabled={lockSplitType}
                required
              />
            </Field>

            <div className="border border-2 border-black my-2"></div>

            <div className="d-flex flex-column p-1 gap-1 fw-bold rounded-1 bg-secondary-subtle">
              <div className="col-12">
                <b>Follow Up Source:</b>
                <span className="ms-2 text-dark">{person?.source || "—"}</span>
              </div>
              <div className="col-12">
                <b>Last Appt Source:</b>
                <span className="ms-2 text-dark">{lastAppt.lastSource || "—"}</span>
              </div>
            </div>

            <div className="border border-2 border-black my-2"></div>

            {renderColaboradores()}

            <hr />

            {/* Custom split inputs */}
            {/* {spliType.includes("CUSTOM") && (
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <Field label="Agent Split">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">%</span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={customSplitValue?.agentSplit}
                        onChange={(e) =>
                          handleSplitCustom("agentSplit", e.target.value)
                        }
                        disabled={!isBroker}
                      />
                    </div>
                  </Field>
                </div>

                <div className="col-12 col-md-6">
                  <Field label="Company Split">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">%</span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={customSplitValue?.companySplit}
                        onChange={(e) =>
                          handleSplitCustom("companySplit", e.target.value)
                        }
                        disabled={!isBroker}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            )} */}

            {/* Save */}
            <div className="d-flex justify-content-center mt-4">
              <button
                type="submit"
                className="btn btn-success px-4"
                disabled={statusBtn}
              >
                <i className="bi bi-floppy me-2" />
                {statusBtn ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}