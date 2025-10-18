import { useState, useRef, useEffect } from 'react';
import { colors } from '../../styles/design-system';
import './ColorPicker.css';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

// Convert design system shape colors to array with labels
const DESIGN_SYSTEM_COLORS = [
  { color: colors.shapes.red, label: 'Red' },
  { color: colors.shapes.orange, label: 'Orange' },
  { color: colors.shapes.yellow, label: 'Yellow' },
  { color: colors.shapes.green, label: 'Green' },
  { color: colors.shapes.blue, label: 'Blue' },
  { color: colors.shapes.indigo, label: 'Indigo' },
  { color: colors.shapes.purple, label: 'Purple' },
  { color: colors.shapes.pink, label: 'Pink' },
  { color: colors.shapes.gray, label: 'Gray' },
  { color: colors.shapes.black, label: 'Black' },
];

export const ColorPicker = ({ selectedColor, onColorChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  
  const spectrumRef = useRef<HTMLDivElement>(null);

  // Convert hex to HSL on mount or when selectedColor changes
  useEffect(() => {
    const hsl = hexToHSL(selectedColor);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
    setCustomColor(selectedColor);
  }, [selectedColor]);

  // Convert HSL to Hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert Hex to HSL
  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSaturation = Math.round((x / rect.width) * 100);
    const newLightness = Math.round(100 - (y / rect.height) * 100);
    
    setSaturation(newSaturation);
    setLightness(newLightness);
    
    const newColor = hslToHex(hue, newSaturation, newLightness);
    setCustomColor(newColor);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    setHue(newHue);
    const newColor = hslToHex(newHue, saturation, lightness);
    setCustomColor(newColor);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    setCustomColor(value);
    
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const hsl = hexToHSL(value);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  };

  const handleCustomColorApply = () => {
    onColorChange(customColor);
    setIsOpen(false);
  };

  // Check if current color is one of the predefined colors
  const isCustomColor = !DESIGN_SYSTEM_COLORS.some(({ color }) => color.toLowerCase() === selectedColor.toLowerCase());

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
            {DESIGN_SYSTEM_COLORS.map(({ color, label }) => (
              <button
                key={color}
                className={`color-option ${selectedColor.toLowerCase() === color.toLowerCase() ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
                title={label}
                aria-label={label}
              />
            ))}
          </div>

          {/* Custom Color Picker Section */}
          <div className="custom-color-section">
            <div className="custom-color-header">
              <span>Custom Color</span>
            </div>
            
            <div className="custom-color-controls">
              {/* Saturation/Lightness Spectrum */}
              <div 
                ref={spectrumRef}
                className="color-spectrum"
                style={{ 
                  background: `
                    linear-gradient(to bottom, transparent, black),
                    linear-gradient(to right, white, hsl(${hue}, 100%, 50%))
                  `
                }}
                onClick={handleSpectrumClick}
              >
                <div 
                  className="color-spectrum-cursor"
                  style={{
                    left: `${saturation}%`,
                    top: `${100 - lightness}%`
                  }}
                />
              </div>

              {/* Hue Slider */}
              <div className="hue-slider-container">
                <label className="slider-label">Hue</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={handleHueChange}
                  className="hue-slider"
                />
              </div>

              {/* Color Preview and Hex Input */}
              <div className="color-result">
                <div 
                  className="color-result-preview" 
                  style={{ backgroundColor: customColor }}
                />
                <div className="hex-input-group">
                  <label htmlFor="hex-input" className="hex-label">HEX</label>
                  <input
                    id="hex-input"
                    type="text"
                    className="hex-input"
                    value={customColor}
                    onChange={handleHexInputChange}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <button 
              className="apply-color-button"
              onClick={handleCustomColorApply}
            >
              Apply Color
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

