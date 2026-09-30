import { Navbar } from "./components/Navbar"
import { Hero } from "./components/Hero"
import { Chapters } from "./components/Chapters"
import { Lab } from "./components/Lab"
import { Credentials } from "./components/Credentials"
import { Footer } from "./components/Footer"

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Chapters />
      <Lab />
      <Credentials />
      <Footer />
    </>
  )
}
