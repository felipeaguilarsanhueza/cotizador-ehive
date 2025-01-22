"use client"; // Para habilitar interactividad

import React, { useState, useEffect } from "react";
import { csv } from "d3-fetch";

// Convierte un File en Base64 (string)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Lee el archivo como Base64
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};


const sendEmail = async (data) => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // <-- cambio: ahora 'data' viaja en un campo 'data' 
      body: JSON.stringify({
        from: "Cotizador Web <mailgun@YOUR_DOMAIN_NAME>",
        to: "felipeaguilarsanhueza@gmail.com",
        subject: "Solicitud de Cotización",
        data, // <-- aquí pasamos el objeto completo con region, cliente, etc.
      }),
    });

    if (!response.ok) {
      console.error("Error sending email");
    } else {
      console.log("Email sent successfully");
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


export default function Page() {
  const [step, setStep] = useState(1);
  const [region, setRegion] = useState("");
  const [comuna, setComuna] = useState("");
  const [regionesComunas, setRegionesComunas] = useState({});
  const [direccion, setDireccion] = useState("");
  const [instalacion, setInstalacion] = useState("");
  const [tablero, setTablero] = useState("");
  const [file, setFile] = useState(null);
  const [distancia, setDistancia] = useState("");
  const [gestionCarga, setGestionCarga] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [precios, setPrecios] = useState([]);
  const [selectedConnectors, setSelectedConnectors] = useState([]);
  const [chargerOptions, setChargerOptions] = useState([]); // Lista cruda del CSV
  const [selectedChargerModel, setSelectedChargerModel] = useState(""); // Lo que elige el usuario


  useEffect(() => {
    const loadChargers = async () => {
      const dataCSV = await csv("/tables/chargers.csv");
      // 'dataCSV' será un array de objetos {tipo, marca, cargador, precio}
      setChargerOptions(dataCSV);
    };
    loadChargers();
  }, []);


  const avanzarPaso = () => {
    if (step < 11) {
      setStep(step + 1);
    }
  };

  const retrocederPaso = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  useEffect(() => {
    console.log("Estado actual:", { region, comuna, direccion, tablero, distancia, clientName, clientPhone, clientEmail });
  }, [region, comuna, direccion, tablero, distancia, clientName, clientPhone, clientEmail]);
  
  useEffect(() => {
    // Cargar los precios desde el CSV
    const loadPrices = async () => {
      const data = await csv("/tables/instalacionprecios.csv");
      setPrecios(data.map((row) => ({
        distancia: parseInt(row.distancia, 10),
        tablero: row.tablero,
        precio: parseInt(row.precio, 10),
      })));
    };
    loadPrices();
  }, []);

  useEffect(() => {
    const loadRegionesComunas = async () => {
      const data = await csv("/tables/regiones_comunas.csv");
      const regionesData = {};
      data.forEach((row) => {
        const { region, comuna } = row;
        if (!regionesData[region]) {
          regionesData[region] = [];
        }
        regionesData[region].push(comuna);
      });
      setRegionesComunas(regionesData);
    };

    loadRegionesComunas();
  }, []);

  const finalizar = async () => {
    let fileBase64 = null;
    if (file) {
      // Esperamos la conversión asíncrona a Base64
      fileBase64 = await fileToBase64(file);
    }

    // Asegúrate de incluir 'selectedVehicle' y el Base64 del archivo
    const data = {
      region,
      comuna,
      direccion,
      tablero,
      distancia,
      serviciosSeleccionados: selectedServices,
      selectedVehicle,
      selectedConnectors,     // <-- El vehículo que seleccionaste
      file: fileBase64,     // <-- El archivo convertido a Base64
      cliente: {
        nombre: clientName,
        telefono: clientPhone,
        correo: clientEmail,
      },
    };

    console.log("Datos enviados:", data);

    // Llamada a la función que hace el fetch
    await sendEmail(data);
    
    alert("Datos enviados correctamente");
  };

  

  
  const calculatePrice = () => {
    const distanciaNum = parseInt(distancia, 10);
    if (!tablero || isNaN(distanciaNum)) return null;
  
    const matchedPrice = precios.find(
      (p) => p.tablero === tablero && p.distancia === distanciaNum
    );
  
    if (matchedPrice) {
      return matchedPrice.precio.toLocaleString("es-CL");
    } else {
      return "No disponible";
    }
  };
  

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]);
  };
  

  useEffect(() => {
    const loadVehicles = async () => {
      const data = await csv("/tables/VehicleModels.csv");
      setVehicles(data);
    };
    loadVehicles();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-lightest">
      {/* Paso 1 */}
      {step === 1 && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-colddark">¿Cuál es tu región?</h1>
          <label htmlFor="region" className="sr-only">Región</label>
          <select
            id="region"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setComuna(""); // Reiniciar comuna al cambiar región
            }}
            className="px-3 py-2.5 text-lg font-bold rounded-lg border focus:outline-none bg-white text-gray-colddark w-full"
          >
            <option value="" disabled>Selecciona tu región</option>
            {Object.keys(regionesComunas).map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
          <button
            onClick={avanzarPaso}
            disabled={!region}
            className="mt-4 px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-colddark">¿Cuál es tu comuna?</h1>
          <label htmlFor="comuna" className="sr-only">Comuna</label>
          <select
            id="comuna"
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="px-3 py-2.5 text-lg font-bold rounded-lg border focus:outline-none bg-white text-gray-colddark w-full"
          >
            <option value="" disabled>Selecciona tu comuna</option>
            {(regionesComunas[region] || []).map((com) => (
              <option key={com} value={com}>{com}</option>
            ))}
          </select>
          <div className="flex justify-between mt-4">
            <button
              onClick={retrocederPaso}
              className="px-6 py-2 text-white bg-gray-dark rounded-lg"
            >
              Atrás
            </button>
            <button
              onClick={avanzarPaso}
              disabled={!comuna}
              className="px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}


      {step === 3 && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-colddark">¿Cuál es tu dirección?</h1>
          <label htmlFor="direccion" className="sr-only">
            Dirección
          </label>
          <input
            id="direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ingresa tu dirección"
            className="px-3 py-2.5 text-lg font-bold rounded-lg border 
                       focus:outline focus:outline-2 focus:outline-offset-2 
                       bg-white text-gray-colddark focus:outline-gray-dark 
                       border-gray-lighter w-full"
          />
          <div className="flex justify-between mt-4">
            <button
              onClick={retrocederPaso}
              className="px-6 py-2 text-white bg-gray-dark rounded-lg"
            >
              Atrás
            </button>
            <button
              onClick={avanzarPaso}
              disabled={!direccion}
              className="px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-colddark">¿Dónde necesitas instalar el cargador de vehículo eléctrico?</h1>
          <label htmlFor="instalacion" className="sr-only">
            Instalación
          </label>
          <select
            id="instalacion"
            value={instalacion}
            onChange={(e) => setInstalacion(e.target.value)}
            className="px-3 py-2.5 text-lg font-bold rounded-lg border 
                       focus:outline focus:outline-2 focus:outline-offset-2 
                       bg-white text-gray-colddark focus:outline-gray-dark 
                       border-gray-lighter w-full"
          >
            <option value="" disabled>
              Selecciona el tipo de instalación
            </option>
            <option value="Tienda comercial">Tienda comercial</option>
            <option value="Oficina">Oficina</option>
            <option value="Flotas de vehículos de trabajo">Flotas de vehículos de trabajo</option>
            <option value="Edificios residenciales">Edificios residenciales</option>
            <option value="Casa particular">Casa particular</option>
          </select>
          <div className="flex justify-between mt-4">
            <button
              onClick={retrocederPaso}
              className="px-6 py-2 text-white bg-gray-dark rounded-lg"
            >
              Atrás
            </button>
            <button
              onClick={avanzarPaso}
              disabled={!instalacion}
              className="px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-coldgray-dark">¿Con qué tablero eléctrico cuentas?</h1>
          <label htmlFor="tablero" className="sr-only">
            Tablero
          </label>
          <select
            id="tablero"
            value={tablero}
            onChange={(e) => setTablero(e.target.value)}
            className="px-3 py-2.5 text-lg font-bold rounded-lg border 
                       focus:outline focus:outline-2 focus:outline-offset-2 
                       bg-white text-gray-colddark focus:outline-gray-dark 
                       border-gray-lighter w-full"
          >
            <option value="" disabled>
              Selecciona el tipo de tablero
            </option>
            <option value="monofasico">Monofásico</option>
            <option value="trifasico">Trifásico</option>
          </select>
          <div className="flex justify-between mt-4">
            <button
              onClick={retrocederPaso}
              className="px-6 py-2 text-white bg-gray-dark rounded-lg"
            >
              Atrás
            </button>
            <button
              onClick={avanzarPaso}
              disabled={!tablero}
              className="px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="w-full max-w-md mx-auto">
          <label className="text-base text-gray-colddark font-semibold mb-2 block">
            Por favor, adjunta tu boleta de luz (opcional)
          </label>
          <input
            type="file"
            className="w-full text-gray-colddark font-semibold text-sm bg-white border file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-lighter file:hover:bg-gray-dark file:text-gray-colddark rounded"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-gray-dark mt-2">
            PNG, JPG, SVG, WEBP, and GIF are Allowed.
          </p>
          <div className="flex justify-between mt-4">
            <button
              onClick={retrocederPaso}
              className="px-6 py-2 text-white bg-gray-dark rounded-lg"
            >
              Atrás
            </button>
            <button
              onClick={avanzarPaso}
              className="px-6 py-2 text-white bg-green-primary rounded-lg"
            >
              Siguiente o Saltar
            </button>
          </div>
        </div>
      )}

{step === 7 && (
  <div className="w-full max-w-md text-center">
    <h1 className="text-2xl font-bold mb-4 text-gray-colddark">¿Cuál es la distancia desde el tablero eléctrico general al estacionamiento?</h1>
    <label htmlFor="distancia" className="sr-only">
      Distancia
    </label>
    <select
      id="distancia"
      value={distancia}
      onChange={(e) => setDistancia(e.target.value)}
      className="px-3 py-2.5 text-lg font-bold rounded-lg border 
                 focus:outline focus:outline-2 focus:outline-offset-2 
                 bg-white text-gray-colddark focus:outline-gray-dark 
                 border-gray-lighter w-full"
    >
      <option value="" disabled>Selecciona la distancia en metros</option>
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((dist) => (
        <option key={dist} value={dist}>{dist} metros</option>
      ))}
    </select>
    <div className="flex justify-between mt-4">
      <button
        onClick={retrocederPaso}
        className="px-6 py-2 text-white bg-gray-dark rounded-lg"
      >
        Atrás
      </button>
      <button
        onClick={avanzarPaso}
        disabled={!distancia}
        className="px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
      >
        Continuar
      </button>
    </div>
  </div>
)}

{step === 8 && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">¿Cuál es tu vehículo eléctrico?</h1>
          <label htmlFor="vehicle" className="sr-only">Vehículo</label>
          <select
            id="vehicle"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="px-3 py-2.5 text-lg font-bold rounded-lg border focus:outline-none bg-white text-gray-colddark w-full"
          >
            <option value="" disabled>Selecciona tu vehículo</option>
            {vehicles.map((vehicle, index) => (
              <option key={index} value={`${vehicle.brand} ${vehicle.model}`}>
                {`${vehicle.brand} - ${vehicle.model}`}
              </option>
            ))}
          </select>
          <div className="flex justify-between mt-4">
            <button
              onClick={retrocederPaso}
              className="px-6 py-2 text-white bg-gray-dark rounded-lg"
            >
              Atrás
            </button>
            <button
              onClick={avanzarPaso}
              disabled={!selectedVehicle}
              className="px-6 py-2 text-white bg-green-dark rounded-lg disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}


{step === 9 && (
  <div className="flex flex-col items-center mx-auto justify-center">
    <h1 className="text-2xl font-bold mb-4 text-gray-colddark">
      ¿Qué conector(es) utiliza tu vehículo?
    </h1>

    {/* Arreglo de conectores */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 m-8">
      {[
        {
          id: "chademo",
          label: "CHAdeMO",
          image: "/images/connectors/CHAdeMO.png",
        },
        {
          id: "gbt_ac",
          label: "GB/T AC",
          image: "/images/connectors/GBT AC.png",
        },
        {
          id: "gbt_dc",
          label: "GB/T DC",
          image: "/images/connectors/GBT DC.png",
        },
        {
          id: "tesla",
          label: "Tesla",
          image: "/images/connectors/Tesla.png",
        },
        {
          id: "type1_combo",
          label: "Tipo 1 Combinado",
          image: "/images/connectors/Tipo 1 Combinado.png",
        },
        {
          id: "type1",
          label: "Tipo 1",
          image: "/images/connectors/Tipo 1.png",
        },
        {
          id: "type2_combo",
          label: "Tipo 2 Combinado",
          image: "/images/connectors/Tipo 2 Combinado.png",
        },
        {
          id: "type2",
          label: "Tipo 2",
          image: "/images/connectors/Tipo 2.png",
        },
      ].map((conn) => {
        const isSelected = selectedConnectors.includes(conn.id);

        return (
          <div
            key={conn.id}
            className={`flex flex-col rounded-2xl bg-white text-gray-700 shadow-xl items-center p-4
              ${isSelected ? "ring-4 ring-green-600" : ""}`}
          >
            {/* Imagen centrada */}
            <figure className="flex justify-center items-center mb-4">
              <img
                src={conn.image}
                alt={conn.label}
                className="w-32 h-32 object-contain"
              />
            </figure>
            {/* Nombre del conector */}
            <div className="text-xl font-semibold text-center mb-2">
              {conn.label}
            </div>
            {/* Botón de selección */}
            <button
              onClick={() => {
                // Si ya está seleccionado, lo quitamos
                if (isSelected) {
                  setSelectedConnectors(
                    selectedConnectors.filter((c) => c !== conn.id)
                  );
                } else {
                  // Si no está seleccionado aún, verificamos que no supere 2
                  if (selectedConnectors.length < 2) {
                    setSelectedConnectors([...selectedConnectors, conn.id]);
                  } else {
                    alert("Solo puedes seleccionar hasta 2 conectores.");
                  }
                }
              }}
              className={`px-4 py-2 mt-2 text-white rounded-lg transition ${
                isSelected ? "bg-green-600" : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              {isSelected ? "Seleccionado" : "Seleccionar"}
            </button>
          </div>
        );
      })}
    </div>

    {/* Botón para continuar (requerimos al menos 1 conector) */}
    <button
      onClick={() => {
        if (selectedConnectors.length > 0) {
          setStep(10); // Avanza al siguiente step
        } else {
          alert("Por favor, selecciona al menos un conector.");
        }
      }}
      className={`px-6 py-3 text-white font-bold rounded-lg transition ${
        selectedConnectors.length > 0
          ? "bg-green-600 hover:bg-green-800"
          : "bg-gray-400 cursor-not-allowed"
      }`}
      disabled={selectedConnectors.length === 0}
    >
      Continuar
    </button>
  </div>
)}




{step === 10 && (
  <div className="flex flex-col items-center mx-auto justify-center">
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 m-8">
      {[
        {
          id: "cargador",
          label: "Cargador",
          description: "Dispositivo de carga eficiente y rápido para vehículos eléctricos.",
          // El precio lo mostraremos dinámico, así que puedes poner un placeholder o dejarlo vacío
          price: null,
          image: "/images/cargador.png",
        },
        {
          id: "instalacion",
          label: "Instalación",
          description: "Instalación segura y garantizada por expertos.",
          price: `$${calculatePrice()} + IVA`,
          image: "/images/instalacion.png",
        },
        {
          id: "gestion-carga",
          label: "Gestión de Carga",
          description: "Sistema avanzado para administrar la carga de múltiples vehículos.",
          price: "$144.990 + IVA",
          image: "/images/gestioncarga.png",
        },
        {
          id: "gestion-pagos",
          label: "Gestión de Pagos",
          description: "Sistema de pagos seguro y confiable para estaciones de carga.",
          price: "$180.000 + IVA",
          image: "/images/pagos.png",
        },
      ].map((service) => {
        // Chequeamos si esta tarjeta es la de "cargador"
        const isCargador = service.id === "cargador";

        // Filtramos el CSV según tu 'tablero' (monofasico/trifasico)
        const filteredChargers = chargerOptions.filter(
          (ch) => ch.tipo === tablero
        );

        // Si el usuario ya seleccionó algo en el <select>, obtenemos su precio
        let selectedChargerPrice = "";
        if (selectedChargerModel) {
          // Buscamos el row en filteredChargers
          const foundRow = filteredChargers.find(
            (ch) => ch.cargador === selectedChargerModel
          );
          if (foundRow) {
            selectedChargerPrice = foundRow.precio; // "999000" por ej.
          }
        }

        return (
          <div
            key={service.id}
            className="flex flex-col rounded-2xl w-full xl:w-96 bg-white text-gray-700 shadow-xl"
          >
            <figure className="flex justify-center items-center">
              <img
                src={service.image}
                alt={service.label}
                className="rounded-t-2xl"
              />
            </figure>
            <div className="flex flex-col p-8 h-full">
              <div className="text-3xl font-bold pb-6">{service.label}</div>
              <div className="text-lg pb-4">{service.description}</div>

              {/* Si NO es "cargador", mostramos el price normal; si es "cargador", mostramos algo dinámico */}
              {!isCargador && (
                <div className="text-xl font-semibold text-green-600 pb-4">
                  {service.price}
                </div>
              )}

              {isCargador && (
                <div className="mb-4">
                  {/* SELECT para elegir el cargador compatible */}
                  <label className="block font-semibold mb-2">
                    Selecciona tu cargador:
                  </label>
                  <select
                    value={selectedChargerModel}
                    onChange={(e) => setSelectedChargerModel(e.target.value)}
                    className="px-2 py-1 border rounded-lg w-full"
                    disabled={filteredChargers.length === 0}
                  >
                    <option value="">
                      {filteredChargers.length === 0
                        ? "No hay cargadores para este tablero"
                        : "Elige un modelo"}
                    </option>
                    {filteredChargers.map((ch, idx) => (
                      <option key={idx} value={ch.cargador}>
                        {ch.marca} - {ch.cargador} - $
                        {parseInt(ch.precio, 10).toLocaleString("es-CL")}
                      </option>
                    ))}
                  </select>

                  {/* Mostramos el precio si hay una opción seleccionada */}
                  {selectedChargerModel && (
                    <p className="mt-2 text-green-700 font-bold">
                      Precio: $
                      {parseInt(selectedChargerPrice, 10).toLocaleString(
                        "es-CL"
                      )} + IVA
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center mt-auto">
                <input
                  type="checkbox"
                  id={service.id}
                  className="mr-2"
                  checked={selectedServices.includes(service.id)}
                  onChange={(e) => {
                    const newSelection = [...selectedServices];
                    if (e.target.checked) {
                      newSelection.push(service.id);
                    } else {
                      const index = newSelection.indexOf(service.id);
                      if (index > -1) newSelection.splice(index, 1);
                    }
                    setSelectedServices(newSelection);
                  }}
                />
                <label htmlFor={service.id} className="text-gray-800 font-semibold">
                  Seleccionar
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Botón para avanzar de step 10 a step 11 */}
    <div className="mt-8">
      <button
        onClick={() => {
          console.log("Servicios seleccionados:", selectedServices);
          if (selectedServices.length > 0) {
            setStep(11); // Avanzar al formulario final
          }
        }}
        disabled={selectedServices.length === 0}
        className={`px-6 py-3 text-white font-bold rounded-lg ${
          selectedServices.length > 0
            ? "bg-green-600 hover:bg-green-800"
            : "bg-gray-400 cursor-not-allowed"
        } transition`}
      >
        Solicitar Cotización Formal
      </button>
    </div>
  </div>
)}



      {step === 11 && (
        <div className="w-full max-w-md mx-auto my-8">
          <h2 className="text-3xl font-bold text-gray-colddark text-center mb-6">Contáctenos</h2>
          <p className="text-lg text-gray-moredark text-center mb-4">Por favor, introduzca sus datos. En 3 días hábiles, un agente de eHive se contactará con usted.</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-darkcold mb-2" htmlFor="clientName">Nombre completo</label>
              <input
                id="clientName"
                type="text"
                placeholder="Nombre completo"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-3 py-2 border rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-darkcold mb-2" htmlFor="clientPhone">Número de teléfono</label>
              <input
                id="clientPhone"
                type="text"
                placeholder="Número de teléfono"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="px-3 py-2 border rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-darkcold mb-2" htmlFor="clientEmail">Correo electrónico</label>
              <input
                id="clientEmail"
                type="email"
                placeholder="Correo electrónico"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="px-3 py-2 border rounded-lg w-full"
              />
            </div>
            <button
              onClick={finalizar}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-800 transition"
            >
              Enviar Datos
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
