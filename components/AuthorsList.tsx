// Renders a comma-separated author string as profile links (server component)
export default function AuthorsList({ authorsStr }: { authorsStr: string }) {
  const authors = authorsStr
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return (
    <>
      {authors.map((author, index) => (
        <span key={`${author}-${index}`}>
          <a href={`/profile/${author}`} className="font-semibold text-amber-500 hover:underline">
            @{author}
          </a>
          {index < authors.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}
