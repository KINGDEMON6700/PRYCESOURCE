export interface StoreStatus {
  status: string;
  text: string;
  color: "green" | "red" | "orange" | "gray";
  message: string;
  todayHours?: string;
}

/**
 * Calcule le statut d'un magasin en temps réel basé sur ses heures d'ouverture
 */
export function getStoreStatus(hours: any): StoreStatus {
  if (!hours) {
    return { 
      status: "unknown", 
      text: "Heures non renseignées", 
      color: "gray",
      message: "Heures non renseignées"
    };
  }
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 100 + now.getMinutes(); // Format HHMM
  
  // Si les heures sont un objet structuré (format préféré)
  if (typeof hours === 'object' && !Array.isArray(hours) && !hours.includes) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = days[currentDay];
    const todayHours = hours[todayKey];
    
    if (!todayHours || todayHours === "Fermé" || todayHours.toLowerCase() === "fermé") {
      return { 
        status: "closed", 
        text: "Fermé aujourd'hui", 
        color: "red",
        message: "Fermé aujourd'hui",
        todayHours: "Fermé"
      };
    }
    
    // Parser les heures (ex: "09:00-18:00")
    const timeRange = todayHours.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (timeRange) {
      const openTime = parseInt(timeRange[1]) * 100 + parseInt(timeRange[2]);
      const closeTime = parseInt(timeRange[3]) * 100 + parseInt(timeRange[4]);
      
      if (currentTime >= openTime && currentTime <= closeTime) {
        return { 
          status: "open", 
          text: `Ouvert jusqu'à ${timeRange[3]}:${timeRange[4]}`, 
          color: "green",
          message: `Ouvert jusqu'à ${timeRange[3]}:${timeRange[4]}`,
          todayHours: todayHours
        };
      } else if (currentTime < openTime) {
        return { 
          status: "closed", 
          text: `Ouvre à ${timeRange[1]}:${timeRange[2]}`, 
          color: "orange",
          message: `Ouvre à ${timeRange[1]}:${timeRange[2]}`,
          todayHours: todayHours
        };
      } else {
        return { 
          status: "closed", 
          text: `Fermé (ouvre demain)`, 
          color: "red",
          message: `Fermé (ouvre demain)`,
          todayHours: todayHours
        };
      }
    }
    
    return { 
      status: "open", 
      text: todayHours, 
      color: "green",
      message: todayHours,
      todayHours: todayHours
    };
  }
  
  // Si les heures sont une chaîne de caractères (format Google Places)
  if (typeof hours === 'string') {
    const lines = hours.split('\n');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[currentDay];
    
    // Trouver la ligne correspondant à aujourd'hui
    const todayLine = lines.find(line => line.startsWith(todayName));
    
    if (!todayLine) {
      return { 
        status: "unknown", 
        text: "Heures non disponibles", 
        color: "gray",
        message: "Heures non disponibles"
      };
    }
    
    // Parser la ligne (ex: "Monday: 8:30 AM – 7:00 PM")
    const timeMatch = todayLine.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
    
    if (timeMatch) {
      let openHour = parseInt(timeMatch[1]);
      const openMin = parseInt(timeMatch[2]);
      const openPeriod = timeMatch[3];
      let closeHour = parseInt(timeMatch[4]);
      const closeMin = parseInt(timeMatch[5]);
      const closePeriod = timeMatch[6];
      
      // Convertir en format 24h
      if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
      if (openPeriod === 'AM' && openHour === 12) openHour = 0;
      if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
      if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;
      
      const openTime = openHour * 100 + openMin;
      const closeTime = closeHour * 100 + closeMin;
      
      const todayHoursDisplay = `${openHour.toString().padStart(2, '0')}:${openMin.toString().padStart(2, '0')}-${closeHour.toString().padStart(2, '0')}:${closeMin.toString().padStart(2, '0')}`;
      
      if (currentTime >= openTime && currentTime <= closeTime) {
        const closeDisplay = closeHour.toString().padStart(2, '0') + ':' + closeMin.toString().padStart(2, '0');
        return { 
          status: "open", 
          text: `Ouvert jusqu'à ${closeDisplay}`, 
          color: "green",
          message: `Ouvert jusqu'à ${closeDisplay}`,
          todayHours: todayHoursDisplay
        };
      } else if (currentTime < openTime) {
        const openDisplay = openHour.toString().padStart(2, '0') + ':' + openMin.toString().padStart(2, '0');
        return { 
          status: "closed", 
          text: `Ouvre à ${openDisplay}`, 
          color: "orange",
          message: `Ouvre à ${openDisplay}`,
          todayHours: todayHoursDisplay
        };
      } else {
        return { 
          status: "closed", 
          text: `Fermé (ouvre demain)`, 
          color: "red",
          message: `Fermé (ouvre demain)`,
          todayHours: todayHoursDisplay
        };
      }
    }
    
    // Vérifier si fermé aujourd'hui
    if (todayLine.includes('Closed') || todayLine.includes('Fermé')) {
      return { 
        status: "closed", 
        text: "Fermé aujourd'hui", 
        color: "red",
        message: "Fermé aujourd'hui",
        todayHours: "Fermé"
      };
    }
    
    return { 
      status: "open", 
      text: "Heures disponibles", 
      color: "green",
      message: "Heures disponibles",
      todayHours: todayLine.split(': ')[1] || "Heures disponibles"
    };
  }
  
  return { 
    status: "unknown", 
    text: "Format d'heures non supporté", 
    color: "gray",
    message: "Format d'heures non supporté"
  };
}

/**
 * Retourne les classes CSS pour l'affichage du statut
 */
export function getStatusClasses(color: StoreStatus['color']) {
  switch (color) {
    case "green":
      return "bg-green-500";
    case "red":
      return "bg-red-500";
    case "orange":
      return "bg-orange-500";
    case "gray":
    default:
      return "bg-gray-500";
  }
}