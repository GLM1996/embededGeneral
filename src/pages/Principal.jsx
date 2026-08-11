import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Summary from '../components/Summary';
import { getCaptacionPeopleMongo, obtainHomes, putStage } from '../config/funciones';
import { formatearFecha } from '../config/utils';
import Loading from '../components/Loading';
import { toast } from "react-toastify";
import NewAppontment from '../components/Appt/NewAppontment';
import ListarAppt from '../components/Appt/ListarAppt';
import DatosCliente from '../components/ApptStatus/DatosCliente';
import Captacion from '../components/DataEntry/Captacion';
import { useAppContext } from '../context/AppContext';
import Splits from '../components/Splits';
import Tasks from '../components/Tasks/ListTask';
import PrincipalFollow from '../components/Follow/PrincipalFollow';
import Form_Reasign from '../components/Reasign/Form_Reasign';
import FormPastClient from '../components/PastClient/FormPastClient';
import VaAsign from '../components/VaAsign/VaAsign';

export default function Principal() {

  const { person, context, isLoading, isDuplicated, error } = useAppContext();
  const [show, setShow] = useState('Summary');
  const [loading, setLoading] = useState(false)
  const [personFilter, setPersonFilter] = useState()
  const [appt, setAppt] = useState([])
  const [allowDuplicated, setAllowDuplicated] = useState(false)

  console.log(context)

  const getApptFub = (valor) => {
    setAppt(valor)
  }

  useEffect(() => {
    if (context?.person?.id) {
      const fetchData = async () => {
        setLoading(true)
        try {
          let result = {}
          //const response = await getCaptacionPeopleMongo(context.person.id);
          const [response, responseDebt] = await Promise.all([
            getCaptacionPeopleMongo(context.person.id),
            obtainHomes(context.person.id)
          ]);
          if (response.success) {
            result = response.data
          }
          if (responseDebt.success) {
            result.dataDebs = responseDebt.data
          }         
          setPersonFilter(result)
        } catch (error) {
          console.log(error)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }, [context?.person?.id])

  const changeShow = (value) => {
    setShow(value)
  }

  const renderView = () => {
    switch (show) {
      case 'Summary':
        return <Summary personFilter={personFilter} getApptFub={getApptFub} key={1} />;// En tu componente principal:       
      case 'Add Appt':
        return <NewAppontment context={context} data="Data" />;
      case 'Listar Appt':
        return <ListarAppt context={context} />;
      case 'Captacion':
        return <Captacion context={context} personFilter={personFilter} person={person} apptFub={appt} />;
      case 'Data Cliente':
        return <DatosCliente personFilter={personFilter} />;
      case 'SPLITS':
        return <Splits personFilter={personFilter} />;
      case 'TASKS':
        return <Tasks />;
      case 'FOLLOW':
        return <PrincipalFollow personFilter={personFilter} />;
      case 'REASIGN':
        return <Form_Reasign />;
      case 'PAST CLIENT':
        return <FormPastClient />;
      case 'VA ASIGN':
        return <VaAsign />;      
      default:
        return <div>Default View</div>;
    }
  };

  const updatePeople = async () => {
    setAllowDuplicated(!allowDuplicated)
    try {
      const dataJson = {
        personId: context.person.id,
        customAllowDuplicated: !allowDuplicated
      };

      const put_stage = await putStage(dataJson);
      if (put_stage.success) {
        toast.success("People actualizada");
      }
      window.location.reload()
    } catch (error) {
      console.log(error);
    }
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center w-100'>
        <Loading text="Loading Context and Client" />
      </div>
    )
  }

  if (isDuplicated.length > 0 && !person?.customAllowDuplicated) {

    return (
      <div className="d-flex justify-content-start align-items-start flex-column w-100 p-4 bg-warning ">
        <h4 className="texto-animate bg-danger p-1 ">
          🚨 Person Duplicated – Contact the ADMIN 🚨
        </h4>
        <div className="w-100 overflow-auto">
          <table className="table align-middle text-center">
            <thead>
              <tr>
                <th>Created</th>
                <th>Name</th>
                <th>Agent</th>
              </tr>
            </thead>
            <tbody>
              {isDuplicated.map((item, index) => (
                <tr key={index}>
                  <td>{formatearFecha(item.created)}</td>
                  <td>
                    <a
                      className="cursor-pointer badge bg-primary text-white fw-bold duplicated-link"
                      href={`https://homelasvegasnevada.followupboss.com/2/people/view/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                    </a>
                  </td>
                  <td>{item.assignedTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {context?.user?.role === "Broker" && (
          <div className='d-flex justify-content-center w-100'>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" value={allowDuplicated} onChange={updatePeople} />
              <label>
                Permitir Duplicado
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className='d-flex justify-content-center align-items-center w-100'>
        <b className='bg-danger p-4 m-2 rounded-1 text-white text-uppercase'>{error.message}</b>
      </div>
    )
  }
  
  return (
    <>
      <Navbar changeMenu={changeShow} personFilter={person} />
      {loading ? (
        <div className='d-flex justify-align-content-center align-items-center w-100'>
          <Loading text="Loading Context" />
        </div>
      ) : (renderView())}
    </>
  );
}