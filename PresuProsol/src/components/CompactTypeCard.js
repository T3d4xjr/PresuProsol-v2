// src/components/CompactTypeCard.jsx
export default function CompactTypeCard({ title, subtitle, imgSrc, onClick }) {
  return (
    <div className="card h-100 shadow-sm border-0 rounded-4 compact-card">
      {/* Imagen con ratio 4:3 */}
      <div className="ratio ratio-4x3 position-relative rounded-top-4 overflow-hidden">
        <img
          src={imgSrc}
          alt={title}
          className="w-100 h-100"
          style={{
            objectFit: "cover",
            transform: "scale(1)",
            transition: "transform .35s ease",
          }}
          onError={(e) => (e.currentTarget.src = "/assets/avatar.jpg")}
        />
      </div>

      <div className="card-body">
        <h3 className="h6 mb-1">{title}</h3>
        {subtitle && (
          <p className="text-muted small mb-3">
            {subtitle}
          </p>
        )}
        <button
          type="button"
          className="btn btn-warning fw-semibold px-3"
          onClick={onClick}
        >
          Configurar
        </button>
      </div>

      <style jsx>{`
        .compact-card:hover img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
