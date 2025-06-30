import { Cloud, Activity } from "lucide-react"

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Cloud className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OHMC</h1>
              <p className="text-gray-600 text-sm">Observatorio Hidrometeorológico</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Activity className="h-5 w-5" />
            <span className="text-sm font-medium">En vivo</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
