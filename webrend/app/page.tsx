// app/page.tsx
import ThreeScene from "./components/scenes/TabletScene";

export default function Home() {
  return (
    <div className="main">
      <section className="h-screen w-full relative overflow-hidden">
        <ThreeScene />
        
      </section>
    </div>
  );
}