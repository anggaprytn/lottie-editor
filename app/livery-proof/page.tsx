export default function LiveryProofPage() {
  // livery-disable-next-line voice.banned_phrase.001: preserved customer testimonial quote
  const quote = "This felt magical";
  // livery-disable-next-line voice.banned_phrase.001
  const badQuote = "magical";
  const claim = "convert any animation perfectly";

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-blue-500">Livery proof</h1>
      <p>{quote}</p>
      <p>{badQuote}</p>
      <p>{claim}</p>
    </main>
  );
}
