/** 2026 alternating release proposal — editorial planning only, never auto published. */
export const TOPICS = [["Why an Octopus Has Three Hearts","Biology","Sea physiology","Campbell Biology"],["Why the Moon Changes Shape","Astronomy","Lunar phases","Astronomy: A Beginner's Guide to the Universe"],["How Bees Navigate Back Home","Biology","Animal navigation","Campbell Biology"],["What Makes Ocean Waves Move","Earth Science","Wave physics","Essentials of Oceanography"],["Why Venus Spins So Slowly","Astronomy","Planetary rotation","The Cosmic Perspective"],["How an Eagle Sees Its Prey","Biology","Avian vision","Animal Physiology"],["Can Coral Build an Island?","Ocean","Coral ecosystem","Coral Reefs: An Ecosystem in Transition"],["What Is Inside a Volcano?","Earth Science","Volcanic anatomy","Understanding Earth"],["Why Saturn Has Rings","Astronomy","Planetary rings","The Cosmic Perspective"],["How a Seahorse Gives Birth","Biology","Seahorse reproduction","Animal Physiology"],["Why Polar Bears Stay Warm","Biology","Heat adaptations","Animal Physiology"],["How Tornadoes Begin","Earth Science","Atmospheric dynamics","Meteorology Today"],["Why You Cannot Hear Sound in Space","Physics","Sound wave mechanics","University Physics"],["How Dolphins Sleep","Biology","Brain and sleep","Animal Physiology"],["What Makes the Aurora Glow","Astronomy","Magnetosphere","The Cosmic Perspective"],["How Trees Pull Water Up","Biology","Xylem transport","Campbell Biology"],["Why the Sea Has Tides","Ocean","Tides and gravity","Essentials of Oceanography"],["How the Eye Sees Color","Biology","Visual pigments","Human Physiology"],["Why Mars Looks Red","Astronomy","Martian minerals","The Cosmic Perspective"],["What Creates a Rainbow","Physics","Light refraction","University Physics"],["How Sharks Detect Electricity","Biology","Ampullae of Lorenzini","Animal Physiology"],["Why Earth Has Seasons","Astronomy","Axial tilt","The Cosmic Perspective"],["How Penguins Survive Ice","Biology","Cold adaptations","Animal Physiology"],["What Lives at Hydrothermal Vents","Ocean","Deep sea ecosystem","Essentials of Oceanography"],["How Clouds Form","Earth Science","Condensation","Meteorology Today"],["How a Hummingbird Hovers","Biology","Wing mechanics","Animal Physiology"],["What Keeps Jupiter's Storms Alive","Astronomy","Gas giant weather","The Cosmic Perspective"],["How Butterflies Sense Plants","Biology","Insect chemoreceptors","Campbell Biology"],["What Is Bioluminescence","Biology","Light chemistry","Campbell Biology"],["Why Some Rocks Float","Earth Science","Pumice porosity","Understanding Earth"],["How Owls Fly Quietly","Biology","Feather aerodynamics","Animal Physiology"],["Why Some Frogs Can Freeze","Biology","Freeze tolerance","Animal Physiology"],["How Jellyfish Move Without a Brain","Biology","Nerve nets","Campbell Biology"],["How Bees Tell Each Other Directions","Biology","Waggle dance","Campbell Biology"],["Why Red Light Fades in Water","Physics","Light absorption","University Physics"],["How Cuttlefish Change Color","Biology","Chromatophores","Animal Physiology"],["How Humpback Whales Sing","Ocean","Underwater acoustics","Animal Physiology"],["Why Coral Is an Animal","Biology","Cnidaria","Campbell Biology"],["How Snowflakes Get Six Arms","Earth Science","Crystallography","Understanding Earth"],["Why Sharks Have Cartilage","Biology","Cartilaginous skeletons","Campbell Biology"],["How Fish Survive Antarctic Seas","Biology","Antifreeze proteins","Animal Physiology"],["What Makes Deep Ocean Currents","Ocean","Thermohaline circulation","Essentials of Oceanography"],["Why Arctic Foxes Turn White","Biology","Seasonal camouflage","Animal Physiology"],["How Penguins Remove Salt","Biology","Salt glands","Animal Physiology"],["What Makes Olympus Mons So Huge","Astronomy","Mars geology","The Cosmic Perspective"],["How Tardigrades Survive Drying","Biology","Cryptobiosis","Campbell Biology"],["Why We Need Leap Years","Astronomy","Orbital periods","Astronomy: A Beginner's Guide to the Universe"],["How Ants Follow Chemical Trails","Biology","Pheromones","Campbell Biology"],["Why Ice Floats on Water","Physics","Density","University Physics"],["How Lightning Makes Thunder","Earth Science","Atmospheric electricity","Meteorology Today"],["Why Woodpeckers Avoid Head Injuries","Biology","Bird cranial biomechanics","Animal Physiology"],["How the Sun Powers Ocean Life","Ocean","Photosynthesis plankton","Essentials of Oceanography"],["Why Planets Orbit Stars","Physics","Gravitational motion","University Physics"],["How a Spider Makes Silk","Biology","Spider protein fibers","Campbell Biology"],["Why the Moon Has Quakes","Astronomy","Lunar tectonics","The Cosmic Perspective"],["How a Plant Defends Its Leaves","Biology","Plant defense","Campbell Biology"],["How Mangroves Protect Coasts","Ocean","Coastal ecosystems","Essentials of Oceanography"],["Why We See Shooting Stars","Astronomy","Meteors","The Cosmic Perspective"],["How a Gecko Climbs Glass","Biology","Adhesion","Animal Physiology"],["Why Bubbles Are Round","Physics","Surface tension","University Physics"],["How Earth Makes a Magnetic Field","Earth Science","Geodynamo","Understanding Earth"],["How Salmon Navigate Home","Biology","Fish migration","Animal Physiology"],["How Stars Are Born","Astronomy","Star formation","The Cosmic Perspective"],["Why Chameleons Change Color","Biology","Structural coloration","Animal Physiology"],["How a Waterfall Erodes Rock","Earth Science","Stream erosion","Understanding Earth"],["How a Whale Breathes Between Dives","Biology","Marine mammal lungs","Animal Physiology"],["Why Comets Have Tails","Astronomy","Solar wind and sublimation","The Cosmic Perspective"],["How Termites Build Cool Towers","Biology","Social insect nests","Campbell Biology"],["How Black Holes Bend Light","Astronomy","Gravitational lensing","The Cosmic Perspective"],["Why Sea Ice Forms from Saltwater","Ocean","Sea ice salinity","Essentials of Oceanography"],["How the Ear Detects Sound","Biology","Hearing","Human Physiology"],["Why Deserts Get Cold at Night","Earth Science","Thermal radiation","Meteorology Today"],["How Bats Use Echolocation","Biology","Sound navigation","Animal Physiology"],["What Makes a Tsunami Move","Ocean","Seismic waves","Essentials of Oceanography"],["How a Cactus Stores Water","Biology","Desert adaptation","Campbell Biology"],["Why Earth's Core Stays Hot","Earth Science","Geothermal energy","Understanding Earth"],["How an Eel Generates Electricity","Biology","Electric organs","Animal Physiology"],["Why Stars Twinkle","Astronomy","Atmospheric turbulence","The Cosmic Perspective"],["How Seagrass Helps Ocean Animals","Ocean","Marine habitats","Essentials of Oceanography"],["How Dragonflies Hunt in Flight","Biology","Insect vision","Animal Physiology"],["How Earth Measures a Year","Astronomy","Orbit and calendars","The Cosmic Perspective"]];
const dateString = d => d.toISOString().slice(0,10);
export function dailyMix(start="2026-10-12",end="2026-12-31"){
  const a=Date.parse(start+"T00:00:00Z"),z=Date.parse(end+"T00:00:00Z");
  if(!Number.isFinite(a)||!Number.isFinite(z)||z<a||z-a>366*86400000)throw Error("invalid_range");
  const items=[];
  for(let epoch=a,i=0;epoch<=z;epoch+=86400000,i++){
    const [title,subject,focus,book]=TOPICS[i%TOPICS.length];
    const short=i%2===0;
    items.push({
      id:"mixed-"+dateString(new Date(epoch)),
      date:dateString(new Date(epoch)),time:"19:30",platform:"youtube",
      format:short?"Shorts":"Video",targetSeconds:short?8:180,aspectRatio:short?"9:16":"16:9",
      title,subject,focus,bookReferenceCandidate:book,
      referenceStatus:"NEEDS_EXACT_EDITION_PAGE_CHECK",
      thumbnail:{ratio:short?"9:16":"16:9",concept:focus+", one striking visual, honest science title"},
      storyboard:short?[
        {start:0,end:2,purpose:"hook",direction:"Show a specific striking phenomenon; introduce one testable question."},
        {start:2,end:6,purpose:"explain",direction:"Illustrate the scientific mechanism with precise, verified geometry; no invented body parts."},
        {start:6,end:8,purpose:"payoff",direction:"Answer the hook fully; finish narration and sound cleanly."}
      ]:[
        {start:0,end:15,purpose:"hook",direction:"Ask the central scientific question and why it matters."},
        {start:15,end:45,purpose:"context",direction:"Define key terms using verified textbook facts."},
        {start:45,end:120,purpose:"mechanism",direction:"Explain mechanism using source-checked labelled graphics and narrated examples."},
        {start:120,end:165,purpose:"application",direction:"Give a concrete surprising implication without inventing statistics."},
        {start:165,end:180,purpose:"payoff",direction:"Answer original question, one sentence takeaway, finish narration before 180s."}
      ],
      status:"Research required",approved:false,generated:false,publishStatus:"Not scheduled",
      needs:{bookEdition:true,pageCitations:true,licenseCheck:true,script:true,voice:true,sourceCheckedDiagram:subject==="Biology",thumbnail:true,finalQA:true}
    });
  }
  return items;
}
export const MIX_2026=dailyMix();
const distinct=x=>[...new Set(x.map(y=>String(y||"").trim()).filter(Boolean))];
export function validateEditorial(input){
  const issues=[],short=input?.format==="Shorts",seconds=Number(input?.targetSeconds||0);
  if(!["Shorts","Video"].includes(input?.format))issues.push("Format must be Shorts or Video");
  if(short&&seconds!==8)issues.push("8-second Veo pilot required; longer Shorts need editing/assembly");
  if(!short&&(seconds<60||seconds>900))issues.push("Video duration should be 1–15 minutes");
  const sources=Array.isArray(input?.sources)?input.sources:[];
  const good=sources.filter(x=>x?.type==="book"&&typeof x.title==="string"&&x.title.trim()&&typeof x.edition==="string"&&x.edition.trim()&&typeof x.page==="string"&&x.page.trim()&&x.verified===true);
  if(good.length<1)issues.push("Book citation required: exact title, edition, page, and human verification");
  const claims=Array.isArray(input?.claims)?input.claims:[];
  if(!claims.length||claims.some(x=>!x?.text||!x?.sourceId||!sources.some(s=>s.id===x.sourceId&&s.verified===true)))issues.push("Every factual claim must trace to a verified book reference");
  if(input?.containsAnatomy===true){
    if(!Array.isArray(input?.anatomyLabels)||!input.anatomyLabels.length||input.anatomyLabels.some(x=>!x.name||!x.sourceId||!sources.some(y=>y.id===x.sourceId&&y.verified===true)))
      issues.push("Anatomy: every labelled organ must be verified against a source; generative visuals alone are not reliable");
  }
  if(!input?.rightsCleared)issues.push("Confirm visual/book-figure copyright and commercial usage permissions");
  const scenes=Array.isArray(input?.scenes)?input.scenes:[];
  if(scenes.length<(short?3:5))issues.push(short?"Need opening, mechanism, and payoff scenes":"Need complete five-part long-form storyboard");
  const purposes=distinct(scenes.map(x=>x.purpose));
  if(!purposes.includes("hook")||!purposes.includes("payoff"))issues.push("Story needs both a clear hook and a complete payoff");
  const segments=scenes.filter(x=>Number.isFinite(Number(x.start))&&Number.isFinite(Number(x.end))).sort((a,b)=>a.start-b.start);
  if(segments.length!==scenes.length||segments[0]?.start!==0||segments.at(-1)?.end!==seconds||segments.some((x,i)=>x.end<=x.start||(i>0&&x.start!==segments[i-1].end)))issues.push("Storyboard timing must cover whole video continuously without gaps");
  const voice=String(input?.voiceover||"").trim();
  const words=voice?voice.split(/\s+/).length:0;
  if(words<(short?5:200)||words>(short?19:480))issues.push(short?"8-second voiceover must be 5–19 words":"Long-form voiceover should be 200–480 words for 3-minute video");
  if(input?.phase==="publish"&&!input?.voiceEndsBeforeOutro)issues.push("Voiceover must finish before final frame, with no cut-off syllable");
  if(!input?.thumbnail?.concept||input.thumbnail?.ratio!==(short?"9:16":"16:9"))issues.push("Distinct thumbnail concept and correct aspect ratio required");
  if(input?.thumbnail?.misleading===true)issues.push("Thumbnail must not exaggerate scientifically");
  if(input?.phase==="publish"&&!input?.manualQualityApproval)issues.push("Owner review is mandatory before sending to YouTube");
  return {passed:issues.length===0,issues,format:input?.format||null};
}
