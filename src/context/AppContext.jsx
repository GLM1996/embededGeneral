import { createContext, useContext, useState, useEffect } from "react";
import { cargarContexto, searchPersonById, searchPersonRelationshipById } from "../config/funciones";
import { verifyEmailPhone } from "../config/utils";
import { leadCampaigns } from "../config/Campaign";

//const APP_SCRIPTS = "https://script.google.com/macros/s/AKfycbw70IVUDGLY5Bjaf5qX7vQIg7zt3-w5IAKRLZsTIeruVnINno3Ms-1eHO19_KCQhtY1/exec"
const APP_SCRIPTS = "https://script.google.com/macros/s/AKfycbyUREj_h_Hb3ohDwdSosjN_DhnDT3Ku0BK2e0yhHFLsVXPXGnTxLCx_hbeDNbme7Ks3SA/exec"

export const AppContext = createContext({
  person: null,
  context: null,
  isLoading: true,
  isDuplicated: [],
  error: null,
});

export const useAppContext = () => useContext(AppContext);

// Proveedor mejorado que carga los datos automáticamente
export const AppContextProvider = ({ children }) => {
  const [person, setPerson] = useState(null);
  const [context, setContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicated, setIsDuplicated] = useState([]);
  const [error, setError] = useState(null);
  const [relationship, setRelationship] = useState([])
  const [dataCampaingSheet, setDataCampaingSheet] = useState([])
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const context = await cargarContexto();
        
        if (context?.person) {
          setContext(context);
          const [personFub, personRelationship] = await Promise.all([
            searchPersonById(context.person.id),
            searchPersonRelationshipById(context.person.id),
            //fetch(`${APP_SCRIPTS}?action=leerSheetCampaing`)
            //fetch(APP_SCRIPTS)
          ])
          //const personFub = await searchPersonById(context.person.id);
          if (!personFub?.success) {
            throw new Error("Problem with the API the FUB");
          }
          if (personFub?.success) setPerson(personFub.data);          

          //const personRelationship = await searchPersonRelationshipById(context.person.id);
          if (!personRelationship?.success) {
            throw new Error("Problem with the API the FUB");
          }
          if (personRelationship?.success) setRelationship(personRelationship.data);         
         
        } else {
          if (context.person === "") {
            throw new Error("No hay Contexto en la URL");
          }
        }
      } catch (error) {
        setError(error)
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // El array vacío hace que se ejecute solo al montar el componente
  
  return (
    <AppContext.Provider value={{ person, context, isLoading, isDuplicated, error, relationship, dataCampaingSheet }}>
      {children}
    </AppContext.Provider>
  );
 
};
