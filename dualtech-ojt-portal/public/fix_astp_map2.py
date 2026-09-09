path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_iframe = """                                        {disputedLoc && (
                                            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4 border-2 border-amber-100 dark:border-amber-900 relative shadow-inner pointer-events-none">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    marginHeight="0"
                                                    marginWidth="0"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${disputedLoc.lon - 0.003},${disputedLoc.lat - 0.003},${disputedLoc.lon + 0.003},${disputedLoc.lat + 0.003}&layer=mapnik&marker=${disputedLoc.lat},${disputedLoc.lon}`}
                                                ></iframe>
                                            </div>
                                        )}"""

new_map = """                                        {disputedLoc && (
                                            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4 border-2 border-amber-100 dark:border-amber-900 relative shadow-inner">
                                                <MapContainer 
                                                    center={[disputedLoc.lat, disputedLoc.lon]} 
                                                    zoom={16} 
                                                    zoomControl={false} 
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; OpenStreetMap contributors'
                                                    />
                                                    <Marker position={[disputedLoc.lat, disputedLoc.lon]} />
                                                </MapContainer>
                                            </div>
                                        )}"""

if old_iframe in content:
    content = content.replace(old_iframe, new_map, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Map replacement successful")
else:
    print("ERROR: old_iframe block not found")
