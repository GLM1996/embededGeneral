import React, { useState, useEffect } from "react";
import CardTask from "./CardTask";
import { getTasksPerson } from "../../config/funciones";
import { useAppContext } from "../../context/AppContext";
import FormTask from "./FormTask";


export default function ListTask() {
  const [tasks, setTasks] = useState([]);
  const { person, context, dataCampaingSheet } = useAppContext();
  const [itemSelected, setItemSelected] = useState(null);
  const [statusbtn, setStatusbtn] = useState(false);
  const [reload, setReload] = useState(false);
  const [showMore, setShowMore] = useState(false)
  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);
  const [currentPageNoCompleted, setCurrentPageNoCompleted] = useState(1);
  const itemsPerPage = 4; // Cambia a 10 o lo que prefieras

  const fethData = async () => {
    const data = await getTasksPerson(person.id);
    console.log(data);
    return data;
  };

  useEffect(() => {
    if (person.id) fethData().then((data) => setTasks(data));
  }, [reload]);

  const handleSelectItem = (item) => {
    setItemSelected(item);
    setStatusbtn(true);
  };
  const handleStatusBtn = () => {
    setStatusbtn(!statusbtn);
    setItemSelected(null);
    setReload(!reload);
  };
  const changeReload = () => {
    setReload(!reload);
  };
  const filterTasksCompleted = tasks.filter(item => item.isCompleted === 1);
  const filterTasksNoCompleted = tasks.filter(item => item.isCompleted === 0);

  const handlePageChangeCompleted = (pageNumber) => {
    setCurrentPageCompleted(pageNumber);
  };

  const indexOfLastItem = currentPageCompleted * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItemsCompleted = filterTasksCompleted.slice(indexOfFirstItem, indexOfLastItem);

  const totalPagesCompleted = Math.ceil(filterTasksCompleted.length / itemsPerPage);

  const handlePageChangeNoCompleted = (pageNumber) => {
    setCurrentPageNoCompleted(pageNumber);
  };

  const indexOfLastItemNo = currentPageNoCompleted * itemsPerPage;
  const indexOfFirstItemNo = indexOfLastItemNo - itemsPerPage;
  const currentItemsCompletedNo = filterTasksNoCompleted.slice(indexOfFirstItemNo, indexOfLastItemNo);

  const totalPagesNoCompleted = Math.ceil(filterTasksNoCompleted.length / itemsPerPage);


  return (
    <>
      {itemSelected || statusbtn ? (
        <>
          <div className="d-flex justify-content-center align-items-center my-1">
            <button
              className="btn btn-success"
              onClick={() => handleStatusBtn()}
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>
          <FormTask item={itemSelected} />
        </>
      ) : (
        <div className="d-flex flex-column">
          <div className="d-flex justify-content-center align-items-center my-1 gap-2">
            <button
              className="btn btn-info"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? (
                <>
                  <i className="bi bi-eye-slash"></i> Hide Completed ...
                </>
              ) : (
                <>
                  <i className="bi bi-eye"></i> Show Completed ...
                </>
              )}
            </button>

          </div>
          {currentItemsCompletedNo.map((item, index) => (
            <CardTask
              key={item.id}
              item={item}
              onClick={handleSelectItem}
              onReload={changeReload}
            />
          ))}
          {/* Paginación */}
          {filterTasksNoCompleted.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-3">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${currentPageNoCompleted === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChangeNoCompleted(currentPageNoCompleted - 1)}>
                      Anterior
                    </button>
                  </li>

                  {[...Array(totalPagesNoCompleted)].map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${currentPageNoCompleted === index + 1 ? "active" : ""}`}
                    >
                      <button className="page-link" onClick={() => handlePageChangeNoCompleted(index + 1)}>
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  {/* Números de página
                  {(() => {
                    const pageNumbers = [];
                    const maxVisiblePages = 5;

                    let startPage = Math.max(
                      1,
                      currentPageNoCompleted - Math.floor(maxVisiblePages / 2)
                    );
                    let endPage = startPage + maxVisiblePages - 1;

                    if (endPage > totalPagesNoCompleted) {
                      endPage = totalPagesNoCompleted;
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(i);
                    }

                    return pageNumbers.map((page) => (
                      <li
                        key={page}
                        className={`page-item ${currentPageNoCompleted === page ? "active" : ""}`}
                      >
                        <button className="page-link" onClick={() => handlePageChangeNoCompleted(page)}>
                          {page}
                        </button>
                      </li>
                    ));
                  })()}                   */}

                  <li className={`page-item ${currentPageNoCompleted === totalPagesNoCompleted ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChangeNoCompleted(currentPageNoCompleted + 1)}>
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
          {showMore && (

            <>
              {currentItemsCompleted.map((item, index) => (
                <CardTask
                  key={item.id}
                  item={item}
                  onClick={handleSelectItem}
                  onReload={changeReload}
                />
              ))}
              {/* Paginación */}
              {filterTasksCompleted.length > itemsPerPage && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination">
                      {/* Botón anterior */}
                      <li className={`page-item ${currentPageCompleted === 1 ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChangeCompleted(currentPageCompleted - 1)}
                        >
                          Anterior
                        </button>
                      </li>

                      {/* Números de página */}
                      {(() => {
                        const pageNumbers = [];
                        const maxVisiblePages = 5;

                        let startPage = Math.max(
                          1,
                          currentPageCompleted - Math.floor(maxVisiblePages / 2)
                        );
                        let endPage = startPage + maxVisiblePages - 1;

                        if (endPage > totalPagesCompleted) {
                          endPage = totalPagesCompleted;
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pageNumbers.push(i);
                        }

                        return pageNumbers.map((page) => (
                          <li
                            key={page}
                            className={`page-item ${currentPageCompleted === page ? "active" : ""}`}
                          >
                            <button className="page-link" onClick={() => handlePageChangeCompleted(page)}>
                              {page}
                            </button>
                          </li>
                        ));
                      })()}

                      {/* Botón siguiente */}
                      <li className={`page-item ${currentPageCompleted === totalPagesCompleted ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChangeCompleted(currentPageCompleted + 1)}
                        >
                          Siguiente
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}

            </>
          )}
        </div >
      )
      }
    </>
  );
}
