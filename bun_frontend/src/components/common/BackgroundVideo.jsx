import bgVideo from "../../assets/auth/bg_video.mp4";

export default function BackgroundVideo() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="fixed top-0 left-0 w-full h-full object-cover -z-10"
    >
      <source src={bgVideo} type="video/mp4" />
    </video>
  );
}
