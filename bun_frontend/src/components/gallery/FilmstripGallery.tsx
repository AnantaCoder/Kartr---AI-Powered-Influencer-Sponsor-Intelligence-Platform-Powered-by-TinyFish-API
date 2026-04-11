interface FilmstripGalleryProps {
  images: {
    src: string;
    alt?: string;
  }[];
  className?: string;
}

export function FilmstripGallery({ images, className = "" }: FilmstripGalleryProps) {
  return (
    <div
      className={`flex w-full h-[420px] gap-4 overflow-hidden ${className}`}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="
            relative flex-1 overflow-hidden rounded-2xl
            transition-all duration-500 ease-in-out
            hover:flex-[3]
          "
        >
          <img
            src={image.src}
            alt={image.alt || ""}
            className=" w-full h-full object-cover
    transition-transform duration-700
    group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
