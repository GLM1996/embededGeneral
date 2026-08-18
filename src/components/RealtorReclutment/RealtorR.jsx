import React, { useCallback, useEffect, useState } from "react";
import { getCustomFields, putStage } from "../../config/funciones";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const RealtorR = () => {
  const { context, person } = useAppContext();

  const [custom, setCustoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusBtn, setStatusBtn] = useState(false);

  const [formData, setFormData] = useState({
    customPARealtorRecruitment: "",
    customPAActiveRealtor: "",
  });

  const ids = [349, 353];

  //Carga las opciones de los Select desde el Follow Up Boss
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const data = await getCustomFields(ids);

        if (data && data.length > 0) {
          setCustoms(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);

        toast.error("Error loading fields", {
          position: "top-right",
          autoClose: 2000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const labelById = useCallback(
    (id) => custom.find((field) => field.id === id)?.label ?? "",
    [custom],
  );

  //Carga los datos ya inicializados
  useEffect(() => {
    console.log(person)
    if (person) {
      const updated = {
        customPARealtorRecruitment: person?.customPARealtorRecruitment,
        customPAActiveRealtor: person?.customPAActiveRealtor,
      };
      setFormData(updated);
    }
  }, [person]);

  const byId = useCallback(
    (id) => custom.find((field) => field.id === id)?.choices ?? [],
    [custom],
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!context?.person?.id) {
      toast.error("Person not found", {
        position: "top-right",
        autoClose: 2000,
      });

      return;
    }

    setStatusBtn(true);

    try {
      const dataJson = {
        personId: context.person.id,
        customPARealtorRecruitment: formData.customPARealtorRecruitment,
        customPAActiveRealtor: formData.customPAActiveRealtor,
      };

      const put_stage = await putStage(dataJson);

      if (!put_stage?.success) {
        throw new Error("Editar Persona FAIL");
      }

      toast.success("Realtor updated", {
        position: "top-right",
        autoClose: 1500,
      });
    } catch (error) {
      console.error("Error saving Realtor:", error);

      toast.error("Error saving Realtor", {
        position: "top-right",
        autoClose: 2000,
      });
    } finally {
      setStatusBtn(false);
    }
  };

  return (
    <div className="container-fluid p-1">
      <form onSubmit={handleSave} className="border rounded-3 bg-white p-2">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-badge text-success"></i>

            <span className="fw-semibold small">Realtor</span>
          </div>

          {loading && (
            <span
              className="spinner-border spinner-border-sm text-success"
              role="status"
              aria-hidden="true"
            ></span>
          )}
        </div>

        {/* Realtor Recruitment */}
        <div className="mb-2">
          <label
            htmlFor="customPARealtorRecruitment"
            className="form-label small fw-semibold mb-1"
          >
            {labelById(349) || "Realtor Recruitment"}
          </label>

          <select
            id="customPARealtorRecruitment"
            className="form-select form-select-sm"
            value={formData.customPARealtorRecruitment}
            onChange={(e) =>
              handleChange("customPARealtorRecruitment", e.target.value)
            }
            disabled={loading || statusBtn}
          >
            <option value="">Select...</option>

            {byId(349).map((option, index) => (
              <option key={`${option}-${index}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Active Realtor */}
        <div className="mb-2">
          <label
            htmlFor="customPAActiveRealtor"
            className="form-label small fw-semibold mb-1"
          >
            {labelById(353) || "Active Realtor"}
          </label>

          <select
            id="customPAActiveRealtor"
            className="form-select form-select-sm"
            value={formData.customPAActiveRealtor}
            onChange={(e) =>
              handleChange("customPAActiveRealtor", e.target.value)
            }
            disabled={loading || statusBtn}
          >
            <option value="">Select...</option>

            {byId(353).map((option, index) => (
              <option key={`${option}-${index}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* SAVE */}
        <div className="d-grid">
          <button
            className="btn btn-success btn-sm"
            type="submit"
            disabled={loading || statusBtn}
          >
            {statusBtn ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-floppy me-1"></i>
                Save
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealtorR;
