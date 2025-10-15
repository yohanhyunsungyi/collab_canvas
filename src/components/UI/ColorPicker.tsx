import { useState } from 'react';
import { SHAPE_COLORS } from '../../utils/colors';
import './ColorPicker.css';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker = ({ selectedColor, onColorChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="color-picker">
      <button
        className="color-picker-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Choose color"
      >
        <div
          className="color-preview"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="color-picker-label">Color</span>
      </button>

      {isOpen && (
        <div className="color-picker-dropdown">
          <div className="color-grid">
            {SHAPE_COLORS.map((color) => (
              <button
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

