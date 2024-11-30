import React from "react"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="root">
      {/* <MobileNav />
      <Sidebar /> */}
      <div className="root-container">
        <div className="wrapper">{children}</div>
      </div>
      {/* <Toaster /> */}
    </main>
  )
}

export default Layout
