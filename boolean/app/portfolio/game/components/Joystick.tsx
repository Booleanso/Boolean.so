'use client';

import React, { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';
import styles from '../game.module.scss';

interface JoystickProps {
  onMove: (data: { forward: number; right: number }) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!joystickContainerRef.current) return;
    
    const joystickManager = nipplejs.create({
      zone: joystickContainerRef.current,
      mode: 'static',
      position: { left: '50%', bottom: '30%' },
      color: 'rgba(255, 149, 0, 0.8)',
      size: 150,
      lockX: false,
      lockY: false,
      dynamicPage: true
    });
    
    joystickManager.on('move', (_, data) => {
      if (data && data.vector) {
        // Increase sensitivity for better mobile movement
        const multiplier = 2.5;
        const distance = Math.min(data.distance / 50, 1) * multiplier; // Normalize and amplify
        
        // Apply distance to the vectors for proportional control
        onMove({
          forward: -data.vector.y * distance,
          right: data.vector.x * distance
        });
      }
    });
    
    joystickManager.on('end', () => {
      // Reset movement when joystick is released
      onMove({ forward: 0, right: 0 });
    });
    
    return () => {
      joystickManager.destroy();
    };
  }, [onMove]);
  
  return (
    <div className={styles.joystickContainer}>
      <div ref={joystickContainerRef} className={styles.joystick}></div>
    </div>
  );
};

export default Joystick; 