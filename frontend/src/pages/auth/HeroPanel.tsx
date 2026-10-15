import { ShieldCheck } from "lucide-react"

export function HeroPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 text-white">
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-tight text-white leading-none">Resolvr</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            Ticket Management System
          </p>
        </div>
      </div>

      <div className="relative z-10 my-auto max-w-md py-12">
        <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
          Enterprise ITSM Platform
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Automated Ticketing & Operations Hub
        </h1>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          Submit service requests, auto-route tickets by technical department, track developer resolution capacity, and generate audit-ready reports.
        </p>
      </div>

      <div className="relative z-10 border-t border-slate-800/80 pt-6 text-xs text-slate-400">
        © 2026 Resolvr ITSM. Authorized access only.
      </div>
    </div>
  )
}
