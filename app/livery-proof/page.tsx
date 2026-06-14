export default function LiveryProofPage() {
  // livery-disable-next-line voice.banned_phrase.001: preserved customer testimonial quote
  const quote = "This felt magical";
  const claim = "edit Lottie animations with brand-aware review";

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-sky-700">Livery proof</h1>
      <p>{quote}</p>
      <p>{claim}</p>
    </main>
  );
}
