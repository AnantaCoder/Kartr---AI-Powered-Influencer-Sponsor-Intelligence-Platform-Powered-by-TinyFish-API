import kartr_virtualai1 from "@/assets/auth/kartr_virtualai1.jpg";
import kartr_virtualai2 from "@/assets/auth/kartr_virtualai2.jpg";
import kartr_virtualai3 from "@/assets/auth/kartr_virtualai3.png";
import kartr_virtualai4 from "@/assets/auth/kartr_virtualai4.png";
import kartr_virtualai5 from "@/assets/auth/kartr_virtualai5.jpg";
import kartr_virtualai6 from "@/assets/auth/kartr_virtualai6.jpg";
import bgImg from "@/assets/auth/bg_img.png";
import { FilmstripGallery } from "./FilmstripGallery";

const images = [
  { src: kartr_virtualai1, alt: "Kartr Virtual AI 1" },
  { src: kartr_virtualai2, alt: "Kartr Virtual AI 2" },
  { src: kartr_virtualai5, alt: "Kartr Virtual AI 3" },
  { src: kartr_virtualai4, alt: "Kartr Virtual AI 4" },
  { src: kartr_virtualai3, alt: "Kartr Virtual AI 5" },
  { src: kartr_virtualai6, alt: "Kartr Virtual AI 5" },
];

export default function Gallery() {
  return (
    <div className="px-6 py-10">
      <FilmstripGallery images={images} />
    </div>
  );
}
