import React, { createContext, useContext, useState, useMemo } from 'react';
import { config as configEmprendedores } from '../config/emprendedores';
import { config as configJovenes } from '../config/jovenes';
import rawData from '../data/data.json';

const PopulationContext = createContext();

export const usePopulation = () => {
  return useContext(PopulationContext);
};

export const PopulationProvider = ({ children }) => {
  const [selectedPopulationId, setSelectedPopulationId] = useState('emprendedores');

  const value = useMemo(() => {
    const activeConfig = selectedPopulationId === 'emprendedores' ? configEmprendedores : configJovenes;
    
    // Safety check in case data.json doesn't have the population yet
    const rawPopulations = rawData.poblaciones || {};
    const activeDataRaw = rawPopulations[selectedPopulationId] || { participantes: [], preguntas_por_dimension: {}, sociodemografico: {}, control_gestion: [] };

    const activeData = {
      participantes: activeDataRaw.participantes || [],
      preguntas_por_dimension: activeDataRaw.preguntas_por_dimension || {},
      sociodemografico: activeDataRaw.sociodemografico || {},
      control_gestion: activeDataRaw.control_gestion || []
    };

    return {
      selectedPopulationId,
      setSelectedPopulationId,
      activeConfig,
      activeData,
      populations: [
        { id: 'emprendedores', name: configEmprendedores.nombre },
        { id: 'jovenes', name: configJovenes.nombre }
      ]
    };
  }, [selectedPopulationId]);

  return (
    <PopulationContext.Provider value={value}>
      {children}
    </PopulationContext.Provider>
  );
};
