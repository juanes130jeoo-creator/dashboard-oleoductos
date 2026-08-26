import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, User, BarChart2, ShieldAlert, ListChecks, Map, Menu, X, ChevronDown } from 'lucide-react'
import { usePopulation } from './context/PopulationContext'

import Home from './components/Home'
import CompanyProfile from './components/CompanyProfile'
import Comparator from './components/Comparator'
import Ranking from './components/Ranking'
import DimensionAnalysis from './components/DimensionAnalysis'
import QuestionView from './components/QuestionView'
import SubregionAnalysis from './components/SubregionAnalysis'
import CharacterizationView from './components/CharacterizationView'

const TABS = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'characterization', label: 'Caracterización de la Población', icon: Users },
  { id: 'subregion', label: 'Análisis Territorial', icon: Map, requiresMap: true },
  { id: 'questions', label: 'Por Pregunta', icon: ListChecks },
  { id: 'profile', label: 'Reporte Individual', icon: User },
  { id: 'comparator', label: 'Comparativas', icon: Users },
  { id: 'ranking', label: 'Ranking General', icon: BarChart2 },
  { id: 'analysis', label: 'Análisis de Dimensiones', icon: ShieldAlert },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { selectedPopulationId, setSelectedPopulationId, activeConfig, populations } = usePopulation()

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setIsMobileMenuOpen(false)
  }

  const handlePopulationChange = (e) => {
    setSelectedPopulationId(e.target.value)
  }

  // Effect to handle map availability changes
  useEffect(() => {
    if (activeTab === 'subregion' && !activeConfig.hasMap) {
      setActiveTab('home')
    }
  }, [activeConfig.hasMap, activeTab])

  // Filter tabs based on config
  const visibleTabs = TABS.filter(tab => !tab.requiresMap || activeConfig.hasMap)

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 shrink-0">
        <div>
          <h1 className="text-slate-900 font-bold text-lg leading-tight">Oleoductos</h1>
          <p className="text-xs text-cyan-600 font-medium">{activeConfig.nombre}</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 
        w-[80vw] max-w-[320px] md:w-64 flex-shrink-0
        bg-white text-slate-700 flex flex-col border-r border-slate-200 shadow-xl md:shadow-sm
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="w-full">
            <h1 className="text-slate-900 font-bold text-lg leading-tight">Dashboard Oleoductos</h1>
            
            <div className="mt-4 relative">
              <label htmlFor="population-select" className="sr-only">Seleccionar Población</label>
              <select
                id="population-select"
                value={selectedPopulationId}
                onChange={handlePopulationChange}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block px-3 py-2 pr-8 font-medium"
              >
                {populations.map(pop => (
                  <option key={pop.id} value={pop.id}>{pop.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
          <button 
            className="md:hidden p-2 -mr-2 -mt-2 text-slate-500 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-6 py-3.5 md:py-3 min-h-[44px] text-left transition-colors ${
                      isActive 
                        ? 'bg-cyan-50 text-cyan-700 border-l-4 border-cyan-500 font-bold md:font-medium' 
                        : 'hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent font-medium md:font-normal'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm md:text-sm">{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 text-slate-800 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto w-full">
          {activeTab === 'home' && <Home />}
          {activeTab === 'characterization' && <CharacterizationView />}
          {activeTab === 'subregion' && <SubregionAnalysis />}
          {activeTab === 'questions' && <QuestionView />}
          {activeTab === 'profile' && <CompanyProfile />}
          {activeTab === 'comparator' && <Comparator />}
          {activeTab === 'ranking' && <Ranking />}
          {activeTab === 'analysis' && <DimensionAnalysis />}
        </div>
      </main>
    </div>
  )
}
