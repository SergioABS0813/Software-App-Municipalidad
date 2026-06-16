import { useState } from 'react';
import './StarRating.css';

function StarRating({ disabled = false, value = 0, onChange }) {
  const [hoverValue, setHoverValue] = useState(0);
  const activeValue = hoverValue || value;

  return (
    <div className="star-rating" role="radiogroup" aria-label="Puntuación del evento">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          aria-checked={value === rating}
          aria-label={`Valorar con ${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`}
          className={rating <= activeValue ? 'is-active' : ''}
          disabled={disabled}
          key={rating}
          role="radio"
          type="button"
          onBlur={() => setHoverValue(0)}
          onClick={() => onChange?.(rating)}
          onFocus={() => setHoverValue(rating)}
          onMouseEnter={() => setHoverValue(rating)}
          onMouseLeave={() => setHoverValue(0)}
        >
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  );
}

export default StarRating;
