import Principal from "./pages/Principal"
import { AppContextProvider } from "./context/AppContext"
import { ToastContainer } from "react-toastify"

function App() {

  return (
    <AppContextProvider>
      {/* El ToastContainer al final del JSX */}
      <ToastContainer position="top-right" autoClose={2000} newestOnTop className="toast-small" />
      <div className="contenedor">
        <Principal />
      </div>
    </AppContextProvider>
  )
}


export default App
