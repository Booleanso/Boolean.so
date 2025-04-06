"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import styles from './HeroSection.module.css';

// Type for location data from repositories
interface LocationData {
  location: string;
  latitude: number;
  longitude: number;
  iconUrl?: string;  // URL to an S3 icon image
}

// Enhanced location type with repo information
interface EnhancedLocation {
  lat: number;
  lng: number;
  name: string;
  repoName: string;
  iconUrl?: string;
}

// Component for the Globe
function Globe({ locations }: { locations: EnhancedLocation[] }) {
  const globeRef = useRef<THREE.Mesh>(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  const [textureFailed, setTextureFailed] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, THREE.Texture | null>>({});
  
  // Try to load a texture but use white if it fails
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      '/earth-texture.jpg',
      (texture) => {
        setTextureLoaded(true);
        if (globeRef.current) {
          (globeRef.current.material as THREE.MeshStandardMaterial).map = texture;
          (globeRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        setTextureFailed(true);
        if (globeRef.current) {
          (globeRef.current.material as THREE.MeshStandardMaterial).color.set(0xffffff);
          (globeRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    );
    
    return () => {
      // Cleanup
    };
  }, []);

  // Load icon textures for locations
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const newLoadedIcons: Record<string, THREE.Texture | null> = {};
    
    // Load textures for all locations with icon URLs
    locations.forEach(location => {
      if (location.iconUrl) {
        textureLoader.load(
          location.iconUrl,
          (texture) => {
            newLoadedIcons[location.repoName] = texture;
            setLoadedIcons(prev => ({ ...prev, [location.repoName]: texture }));
          },
          undefined,
          (error) => {
            console.error(`Error loading icon for ${location.repoName}:`, error);
            newLoadedIcons[location.repoName] = null;
            setLoadedIcons(prev => ({ ...prev, [location.repoName]: null }));
          }
        );
      } else {
        newLoadedIcons[location.repoName] = null;
      }
    });
    
    return () => {
      // Cleanup textures
      Object.values(newLoadedIcons).forEach(texture => {
        if (texture) texture.dispose();
      });
    };
  }, [locations]);

  // Slow rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.001;
      }
    }, 10);
    return () => clearInterval(interval);
  }, []);
  
  // Generate a color based on location name
  const getLocationColor = (name: string) => {
    // Generate a deterministic but varied color based on the string
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      '#007AFF', // iOS blue
      '#34C759', // iOS green
      '#FF9500', // iOS orange
      '#FF2D55', // iOS pink
      '#AF52DE', // iOS purple
      '#5856D6', // iOS indigo
      '#FF3B30', // iOS red
      '#5AC8FA', // iOS light blue
      '#FFCC00'  // iOS yellow
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get the first letter or icon for the marker
  const getLocationIcon = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  // Create a rounded rectangle shape for iOS app icons
  const createRoundedRectShape = (width: number, height: number, radius: number) => {
    const shape = new THREE.Shape();
    
    // Starting at top-right corner
    shape.moveTo(width/2 - radius, -height/2);
    shape.lineTo(-width/2 + radius, -height/2);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2, -height/2 + radius);
    shape.lineTo(-width/2, height/2 - radius);
    shape.quadraticCurveTo(-width/2, height/2, -width/2 + radius, height/2);
    shape.lineTo(width/2 - radius, height/2);
    shape.quadraticCurveTo(width/2, height/2, width/2, height/2 - radius);
    shape.lineTo(width/2, -height/2 + radius);
    shape.quadraticCurveTo(width/2, -height/2, width/2 - radius, -height/2);
    
    return shape;
  };

  return (
    <>
      {/* Globe sphere */}
      <mesh ref={globeRef} receiveShadow castShadow>
        <sphereGeometry args={[3, 64, 64]} />
        <meshStandardMaterial 
          color={textureFailed ? 0xffffff : 0xeeeeee} 
          roughness={0.5} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Grid lines for visual reference */}
      <mesh>
        <sphereGeometry args={[3.01, 36, 18]} />
        <meshBasicMaterial 
          color={0x2980b9} 
          wireframe={true} 
          transparent={true} 
          opacity={0.1} 
        />
      </mesh>
      
      {/* Location markers as iOS-style app icons */}
      {locations.map((location, index) => {
        // Calculate the position on the sphere for each marker
        const phi = (90 - location.lat) * (Math.PI / 180);
        const theta = (location.lng + 180) * (Math.PI / 180);
        
        // Position slightly further from sphere surface to prevent clipping
        const distanceFactor = 3.3;
        const x = -(distanceFactor * Math.sin(phi) * Math.cos(theta));
        const z = distanceFactor * Math.sin(phi) * Math.sin(theta);
        const y = distanceFactor * Math.cos(phi);
        
        // Get color and icon
        const color = getLocationColor(location.repoName);
        const icon = getLocationIcon(location.repoName);
        
        // Truncate location name if it's too long
        const displayName = location.name.length > 10 
          ? location.name.substring(0, 10) + '...' 
          : location.name;
        
        // Create rounded rect shape for iOS app icon
        const iconShape = createRoundedRectShape(0.3, 0.3, 0.06);
        
        // Check if we have a loaded icon texture for this location
        const hasCustomIcon = loadedIcons[location.repoName] !== undefined && loadedIcons[location.repoName] !== null;
        
        return (
          <group key={index} position={[x, y, z]}>
            <Billboard
              follow={true}
              lockX={false}
              lockY={false}
              lockZ={false}
            >
              <group>
                {/* iOS app-style icon with rounded corners */}
                <mesh>
                  <shapeGeometry args={[iconShape]} />
                  <meshBasicMaterial 
                    color={color} 
                    side={THREE.DoubleSide}
                  />
                </mesh>
                
                {/* Icon image or text label */}
                {hasCustomIcon ? (
                  <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[0.25, 0.25]} />
                    <meshBasicMaterial
                      map={loadedIcons[location.repoName] as THREE.Texture}
                      transparent={true}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <Text
                    position={[0, 0, 0.002]}
                    fontSize={0.15}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    renderOrder={2}
                  >
                    {icon}
                  </Text>
                )}
                
                {/* Repository name below */}
                <Text
                  position={[0, -0.2, 0.002]}
                  fontSize={0.06}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                  renderOrder={2}
                >
                  {location.repoName.replace('.com', '')}
                </Text>
                
                {/* Location name below repo name */}
                <Text
                  position={[0, -0.28, 0.002]}
                  fontSize={0.05}
                  color="rgba(255,255,255,0.8)"
                  anchorX="center"
                  anchorY="middle"
                  renderOrder={2}
                >
                  {displayName}
                </Text>
              </group>
            </Billboard>
          </group>
        );
      })}
    </>
  );
}

export default function HeroSection() {
  const [locations, setLocations] = useState<EnhancedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reposScanned, setReposScanned] = useState<number>(0);
  const [locationsFound, setLocationsFound] = useState<number>(0);

  useEffect(() => {
    async function fetchLocations() {
      try {
        // First, get all repos from the organization
        console.log('Fetching repositories from WebRendHQ organization...');
        const reposResponse = await axios.get('https://api.github.com/orgs/WebRendHQ/repos?per_page=100');
        const repos = reposResponse.data;
        setReposScanned(repos.length);
        
        console.log(`Found ${repos.length} repositories to scan`);
        
        // Try to find location.json in each repo, trying different branch names
        const locationPromises = repos.map(async (repo: any) => {
          console.log(`Scanning repository: ${repo.name}, default branch: ${repo.default_branch || 'unknown'}`);
          
          // Get the default branch name or fallback to common ones
          const branchesToTry = [
            repo.default_branch, // Try the default branch first if available
            'main',
            'master',
            'development',
            'dev'
          ].filter(Boolean); // Remove any undefined values
          
          // Try each branch name until we find a location.json
          for (const branch of branchesToTry) {
            try {
              const url = `https://raw.githubusercontent.com/WebRendHQ/${repo.name}/${branch}/location.json`;
              console.log(`Trying to fetch: ${url}`);
              
              const locationResponse = await axios.get(url, { timeout: 5000 });
              
              if (locationResponse.status === 200 && locationResponse.data) {
                const locationData = locationResponse.data;
                
                // Verify that we have valid location data with coordinates
                if (
                  locationData.location && 
                  typeof locationData.latitude === 'number' && 
                  typeof locationData.longitude === 'number'
                ) {
                  console.log(`✅ Found valid location.json in ${repo.name} (${branch}):`, locationData);
                  
                  // Create enhanced location object
                  const enhancedLocation: EnhancedLocation = {
                    lat: locationData.latitude,
                    lng: locationData.longitude,
                    name: locationData.location,
                    repoName: repo.name,
                    iconUrl: locationData.iconUrl || undefined
                  };
                  
                  return enhancedLocation;
                } else {
                  console.log(`❌ Invalid location data in ${repo.name} (${branch}):`, locationData);
                  console.log(`Required format: { "location": "City Name", "latitude": number, "longitude": number, "iconUrl": "optional-url" }`);
                }
              }
              // If we get here without returning, this branch didn't have a valid location.json
            } catch (error) {
              // Only log 404s if in the last branch attempt
              if (branch === branchesToTry[branchesToTry.length - 1]) {
                console.log(`❌ No location.json found in ${repo.name} on any branch`);
              }
              // Don't return here, we'll try the next branch
            }
          }
          
          // If we get here, we didn't find a valid location.json in any branch
          return null;
        });
        
        const locationResults = await Promise.allSettled(locationPromises);
        
        // Filter out only fulfilled promises with valid locations
        const validLocations = locationResults
          .filter(
            (result): result is PromiseFulfilledResult<EnhancedLocation> => 
              result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);
        
        setLocationsFound(validLocations.length);
        console.log(`Found ${validLocations.length} valid locations from ${repos.length} repositories`);
        
        if (validLocations.length > 0) {
          setLocations(validLocations);
        } else {
          console.log('No valid locations found in repos. Sample location.json format:');
          console.log(`
{
  "location": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "iconUrl": "https://example.com/icon.png" (optional)
}
          `);
          setError('No location.json files found. Add a location.json to any repo with latitude, longitude and location fields.');
          
          // Just set some placeholder locations as a fallback
          setLocations([
            { 
              lat: 40.7128, 
              lng: -74.0060, 
              name: 'New York', 
              repoName: 'Example Repo',
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
        setError('Failed to fetch location data from GitHub repositories.');
        
        // Add default location as fallback
        setLocations([
          { 
            lat: 40.7128, 
            lng: -74.0060, 
            name: 'New York', 
            repoName: 'Example Repo',
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLocations();
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.heading}>
            <h1>WebRend</h1>
            <p className={styles.subtitle}>
              Turn ideas into reality—fast, lean, and strategically
            </p>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.scanStats}>
            {!loading && (
              <p className={styles.scanInfo}>
                Scanned {reposScanned} repositories, found {locationsFound} location.json files
              </p>
            )}
          </div>

          <div className={styles.ctas}>
            <a href="#contact" className={styles.primaryBtn}>Get Started</a>
            <a href="#services" className={styles.secondaryBtn}>Explore Services</a>
          </div>
        </div>

        <div className={styles.globeContainer}>
          {loading ? (
            <div className={styles.loading}>Loading globe...</div>
          ) : (
            <Canvas shadows camera={{ position: [0, 0, 5.5], fov: 70 }}>
              <ambientLight intensity={0.5} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={1} 
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024}
              />
              <Suspense fallback={null}>
                <Globe locations={locations} />
              </Suspense>
              <OrbitControls 
                enableZoom={false}
                enablePan={false}
                rotateSpeed={0.2}
                zoomSpeed={0.5}
                minDistance={5}
                maxDistance={8}
                autoRotate={true}
                autoRotateSpeed={0.5}
              />
            </Canvas>
          )}
        </div>
      </div>
    </section>
  );
} 