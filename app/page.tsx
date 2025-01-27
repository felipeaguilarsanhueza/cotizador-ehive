"use client"; // Para habilitar interactividad

import React, { useState, useEffect } from "react";
import { csv } from "d3-fetch";

// Convierte un File en Base64 (string)
const fileToBase64 = (file: Blob): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Lee el archivo como Base64
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};



const sendEmail = async (data: {
  region: string;
  comuna: string;
  direccion: string;
  tablero: string;
  distancia: string;
  serviciosSeleccionados: string[]; // Cambiado de never[] a string[]
  selectedVehicle: string;
  selectedConnectors: string[]; // Cambiado de never[] a string[]
  file: string | ArrayBuffer | null; // Especificar que puede ser string o ArrayBuffer
  cliente: {
    nombre: string;
    telefono: string;
    correo: string;
  };
}) => {
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
  const [regionesComunas, setRegionesComunas] = useState<RegionesComunas>({});
  const [direccion, setDireccion] = useState("");
  const [instalacion, setInstalacion] = useState("");
  const [tablero, setTablero] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [distancia, setDistancia] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [precios, setPrecios] = useState<Price[]>([]);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [chargerOptions, setChargerOptions] = useState<ChargerOption[]>([]);
  const [selectedChargerModel, setSelectedChargerModel] = useState(""); // Lo que elige el usuario

  type RegionesComunas = {
    [region: string]: string[];
  };  

  type ChargerOption = {
    tipo: string;
    marca: string;
    cargador: string;
    precio: string;
  };

  type Price = {
    distancia: number;
    tablero: string;
    precio: number;
  };

  type Vehicle = {
    brand: string;
    model: string;
    battery: string;
  };


  useEffect(() => {
    const loadChargers = async () => {
      const dataCSV = await csv("/tables/chargers.csv") as ChargerOption[];
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
    const loadPrices = async () => {
      const data = await csv("/tables/instalacionprecios.csv");
      setPrecios(
        data.map((row) => ({
          distancia: parseInt(row.distancia, 10),
          tablero: row.tablero,
          precio: parseInt(row.precio, 10),
        }))
      );
    };
    loadPrices();
  }, []);

  useEffect(() => {
    const loadRegionesComunas = async () => {
      const data = await csv("/tables/regiones_comunas.csv");
      const regionesData: RegionesComunas = {}; // Especifica el tipo aquí
      data.forEach((row: any) => {
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
  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };
  

  useEffect(() => {
    const loadVehicles = async () => {
      const data = await csv("/tables/VehicleModels.csv") as Vehicle[];
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
          description: "",
          price: null,
          image: "/images/cargador.png",
        },
        {
          id: "instalacion",
          label: "Instalación",
          description:
            "Instalamos tus puntos de carga con seguridad y cumplimiento normativo. Garantizamos una solución confiable y a tu medida.",
          price: `$${calculatePrice()} + IVA`,
          image: "/images/instalacion.png",
        },
        {
          id: "gestion-carga",
          label: "Gestión de Carga",
          description:
            "Carga sin ampliar tu potencia contratada. El sistema monitorea el consumo y ajusta la velocidad para un rendimiento óptimo.",
          price: "$144.990 + IVA",
          image: "/images/gestioncarga.png",
        },
        {
          id: "gestion-pagos",
          label: "Gestión de Pagos",
          description:
            "Ehive administra tus cargadores desde web y app móvil. Simplifica la operación y permite pagos seguros en pocos pasos.",
          price: "$180.000 + IVA",
          image: "/images/pagos.png",
        },
      ].map((service) => {
        const isCargador = service.id === "cargador";

        let filteredChargers: ChargerOption[] = [];
        if (isCargador) {
          filteredChargers = chargerOptions.filter(
            (ch) => ch.tipo === tablero
          );
        }

        const calculateChargeTime = () => {
          const vehicle = vehicles.find(
            (v) =>
              `${v.brand} ${v.model}` === selectedVehicle
          );

          if (!vehicle || !vehicle.battery || !tablero) return "N/A";

          const batteryCapacity = parseFloat(vehicle.battery);
          const chargeRate = tablero === "monofasico" ? 7 : 11;
          const chargeTimeInHours = batteryCapacity / chargeRate;

          const hours = Math.floor(chargeTimeInHours);
          const minutes = Math.floor((chargeTimeInHours - hours) * 60);

          // Lógica ajustada para mostrar solo minutos si las horas son 0
          if (hours === 0) {
            return (
              <>
                <b>{minutes}</b> minuto{minutes !== 1 ? "s" : ""}
              </>
            );
          }

          if (minutes === 0) {
            return (
              <>
                <b>{hours}</b> hora{hours !== 1 ? "s" : ""}
              </>
            );
          }

          return (
            <>
              <b>{hours}</b> hora{hours !== 1 ? "s" : ""} y{" "}
              <b>{minutes}</b> minuto{minutes !== 1 ? "s" : ""}
            </>
          );
        };

        const chargeTime = isCargador ? calculateChargeTime() : null;

        const vehicle = vehicles.find(
          (v) => `${v.brand} ${v.model}` === selectedVehicle
        );
        const brand = vehicle ? vehicle.brand : "vehículo";

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
              <div className="text-lg pb-4">
                {/* Solo mostrar el texto dinámico en la tarjeta de Cargador */}
                {isCargador ? (
                  <>
                    Carga tu <b>{brand}</b> en {chargeTime} con nuestra solución
                    rápida y eficiente, diseñada pensando en la comodidad y el
                    estilo.
                  </>
                ) : (
                  service.description
                )}
              </div>

              {!isCargador && (
                <div className="text-xl font-semibold text-green-600 pb-4">
                  {service.price}
                </div>
              )}

              {isCargador && (
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Selecciona tu cargador:
                  </label>
                  <select
                    value={selectedChargerModel}
                    onChange={(e) =>
                      setSelectedChargerModel(e.target.value)
                    }
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

                  {selectedChargerModel && (
                    <p className="mt-2 text-green-700 font-bold">
                      Precio: $
                      {parseInt(
                        filteredChargers.find(
                          (ch) => ch.cargador === selectedChargerModel
                        )?.precio || "0",
                        10
                      ).toLocaleString("es-CL")}{" "}
                      + IVA
                    </p>
                  )}
                </div>
              )}

              {/* Checkbox para seleccionar el servicio */}
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
                <label
                  htmlFor={service.id}
                  className="text-gray-800 font-semibold"
                >
                  Seleccionar
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    <div className="mt-8">
      <button
        onClick={() => {
          console.log("Servicios seleccionados:", selectedServices);
          if (selectedServices.length > 0) {
            setStep(11);
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
    <footer className="mt-12 text-center text-sm text-gray-500">
      * Precio final sujeto a stock y a previa visita técnica en el lugar de la instalación.
    </footer>
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
