// src/components/MosqTypeCard.jsx
import Image from "next/image";

export default function MosqTypeCard({ title, imgSrc, onClick }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="ratio ratio-16x9">
        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          style={{ objectFit: "cover", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h3 className="h6 mb-3">{title}</h3>
        <button
          className="btn mt-auto"
          onClick={onClick}
          style={{
            background: "var(--accent)",
            color: "var(--surface)",
            fontWeight: 600,
            border: "none",
          }}
        >
          Configurar
        </button>
      </div>
    </div>
  );
}
