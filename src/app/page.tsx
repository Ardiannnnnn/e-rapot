import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Main from "../components/main"

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-zinc-900 flex flex-col justify-between selection:bg-[#1b4332] selection:text-emerald-100">
      <Navbar />
      <Main />
      <Footer />
    </div>
  );
}