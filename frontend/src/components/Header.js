import { Cloud, Activity } from "lucide-react"

const Header = () => {
  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Cloud className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">OHMC</h1>
              <p className="text-white/80 text-sm">Observatorio Hidrometeorológico</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white/80">
            <Activity className="h-5 w-5" />
            <span className="text-sm">En vivo</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
