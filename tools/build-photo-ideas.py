#!/usr/bin/env python3
"""Download place reference photos and write photos/ideas.json.

Each frame is an angle, the light, and how to take it. No camera recipes.
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "photos"
OUT_JSON = OUT_DIR / "ideas.json"
UA = "JapanTripPhotoGuide/1.0 (personal itinerary; local reference photos)"
SKIP_TITLE = re.compile(
    r"map|diagram|icon|logo|coat of arms|flag of|locator|pictogram|"
    r"wikidata|route map|floor plan|floorplan|signage|svg|emblem|seal of",
    re.I,
)
DATE = re.compile(
    r"^(?:\d{4}(?:[-./]\d{1,2}){0,2}|\d{6,8}|dsc[a-z]?\d*|img[ _]?\d*|p\d{4,}|untitled)$",
    re.I,
)
TAG = re.compile(r"<[^>]+>")


def fr(keys, look, angle, alt, light, *how):
    return {
        "keys": [k.strip().lower() for k in keys.split("|") if k.strip()],
        "look": look,
        "angle": angle,
        "alt": alt,
        "light": light,
        "how": list(how),
    }


def place(pid, name, day, match, queries, needles, stand, daylight, frames):
    return {
        "id": pid,
        "name": name,
        "day": day,
        "match": match,
        "queries": queries,
        "needles": [n.lower() for n in needles],
        "stand": stand,
        "daylight": daylight,
        "frames": frames,
    }


PLACES = [
    place(
        "sensoji",
        "Sensō-ji",
        "Day 2",
        ["Sensō-ji", "Senso-ji", "Kaminarimon", "Nakamise", "Shin-Nakamise", "Asakusa Menchi", "Kagetsudō", "Tokiwado", "Asakusa"],
        ["Sensō-ji Tokyo", "Kaminarimon", "Nakamise-dori"],
        ["senso", "sensō", "asakusa", "kaminari", "nakamise", "thunder"],
        "You are in front of the temple, on the shopping street that leads to it.",
        "Morning is the useful light. The gate is in sun, and the street is not packed yet. After 10:00, wait for a gap.",
        [
            fr("lantern|kaminari|thunder", "Lantern from the south",
               "Stand on the crossing south of Kaminarimon, not under the gate. Camera at your eyes. The lantern sits in the top half. Nakamise runs away behind it.",
               "Step closer until the lantern fills the frame. Drop the camera to your chest and point up, so the red face is above you.",
               "Sun on the front of the lantern. If it is a black shape, walk until the sun is on the paper.",
               "Wait for a gap in the crossing.",
               "One person walks away from you, under the lantern, not looking back.",
               "Take it when the lantern is sharp. The street behind can be soft."),
            fr("nakamise|shopping street", "Nakamise, looking toward the hall",
               "Stand in the middle of Nakamise, camera at your chest, aimed straight down the stall roofs at the temple.",
               "Turn 90 degrees and shoot one stall front. The lanterns and the goods fill the frame. Cut off the sky.",
               "Open shade under the stall roofs. A patch of sun on one stall is enough. Do not shoot into a white sky.",
               "Hold the camera level so the roofs do not lean.",
               "If someone walks through the middle, let them, or wait one second.",
               "Take a second frame from one step to the left."),
            fr("main hall|hondo|kannondo", "Main hall front",
               "From the bottom of the steps, camera at your eyes, the hall centered. Leave the incense burner in the foreground if it is there.",
               "Climb to the side of the steps and shoot along the front of the hall, so the lanterns repeat.",
               "The hall faces south. Morning sun hits the front. Midday the porch is dark. Expose for the wood, not the sky.",
               "Stand off the center line so you are not in the worshippers' path.",
               "No pose in the doorway. A person on the steps, small, back to you, is enough.",
               "Take it, then one frame of a single lantern under the eaves."),
            fr("incense|jokoro|smoke", "Incense smoke",
               "Stand to the side of the burner, camera at the smoke, not at people's faces.",
               "Come closer so the smoke fills the frame and the hall is only a soft shape behind it.",
               "The smoke shows when the sun is behind it. If the smoke disappears, move until you see it against a darker roof.",
               "Do not blow the smoke at the lens.",
               "Wait for a thick puff.",
               "Take three frames. Keep the one where the smoke has a shape."),
            fr("pagoda|five-stor", "Five-story pagoda",
               "From the west side of the courtyard, camera at your eyes, pagoda against the sky. Step back until all five roofs fit.",
               "Kneel and point up. The roofs stack. Cut off the base if you have to.",
               "Sun on one side of the red wood, shade on the other. A flat grey sky still works if the pagoda is the only thing in the frame.",
               "Keep people at the bottom edge, or leave them out.",
               "Hold the camera straight so the pagoda does not lean.",
               "Take one wide and one of a single roof corner."),
            fr("omikuji|fortune", "Omikuji tied on the rack",
               "Close, camera a hand's width from the paper knots. The rack fills the frame.",
               "Step back so a person tying a paper is small and the white papers make the background.",
               "Shade. The papers are white. If they burn out, turn so the sun is not on them.",
               "Your hands can be in the frame, tying one paper. Do not photograph a stranger's hands up close.",
               "Focus on the nearest knot.",
               "Take two. One with your hands, one of the papers only."),
            fr("menchi|katsu|snack", "Menchi at the gate",
               "At the shop window, camera at the counter, looking slightly down at the katsu in the hand.",
               "Hold the bag up with the lantern soft behind it. The food is sharp. The gate is only color.",
               "Daylight at the shop front. If the food is in a black doorway, step out until the sun hits the crust.",
               "The person holds the bag at chest height and looks at the food, not at you.",
               "Fill the frame with the katsu.",
               "Take it before the first bite."),
            fr("gate|night|evening", "Gate from the side",
               "Stand on the east or west side of the gate and shoot through the opening, so the lantern is a circle and the street is a tunnel.",
               "Same side, lower. Put the lantern in the top corner and the stone floor in the bottom.",
               "Side light. One edge of the gate bright, the inside of the tunnel darker.",
               "A person walks through the opening, small.",
               "Keep the camera level.",
               "Wait until the opening is not full of faces."),
        ],
    ),
    place(
        "kappabashi",
        "Kappabashi",
        "Day 2",
        ["Kappabashi", "Kama-asa", "Kamata Hakensha", "Ganso Shokuhin Sample-ya", "Maizuru"],
        ["Kappabashi Tokyo", "Kitchen Town Tokyo plastic food"],
        ["kappabashi", "kappa", "kitchen town", "plastic food", "sample"],
        "You are on the chef-supply street, about a ten-minute walk west of the temple.",
        "Shops open around 10:00. The street is open shade. Window displays are the light.",
        [
            fr("kappa|statue|sign", "Kappa sign over the street",
               "Stand in the middle of the street, camera at your eyes, the kappa figure centered above the shops.",
               "Closer, pointed up, so the kappa fills the top and the shop signs stack under it.",
               "Daylight on the sign. If the sign is in shade and the sky is white, come back when the sun is on it, or point up and leave the sky out.",
               "Nobody needs to pose. If a person walks under the sign, let them be small.",
               "Hold the camera straight.",
               "Take one with the street empty enough to read the sign."),
            fr("plastic|sample|display|window", "Plastic food in the window",
               "Camera at the glass, square to the window, so the plastic ramen fills the frame. Watch your reflection.",
               "Step to the side so the reflection leaves the food. Shoot along the window.",
               "The shop lights the food. If you and the sky reflect in the glass, move until the food is brighter than the reflection.",
               "Your hands can hold one sample you are buying, at the window, looking down at it.",
               "Focus on the food, not the glass.",
               "Take two, one straight and one from the side."),
            fr("knife|kama|blade", "Knife on the counter",
               "At Kama-asa or Kamata, camera looking down at one knife on the board. The blade runs corner to corner.",
               "From the shop doorway, the wall of knives is the picture. You stay outside the counter.",
               "Shop light. A bright blade and a dark handle is what you want. Do not use flash.",
               "The shopkeeper is not the subject. Your hand can rest beside the knife you are considering.",
               "Ask before you photograph across the counter.",
               "One frame of the knife, one of the wall."),
            fr("street|dougu", "Down the supply street",
               "From one end of a block, camera at your chest, the street and the signs going away from you.",
               "Turn into a shop entrance and shoot the noren and the first step.",
               "Even daylight. Signs in the shade are better than a blown sky.",
               "Walk while you shoot, camera at your chest, so you are not standing in the road.",
               "Take one frame per block, not ten of the same view.",
               "Step to the curb if a truck comes."),
        ],
    ),
    place(
        "ameyoko",
        "Ameyoko",
        "Day 2",
        ["Ameyoko", "Ameya-Yokocho"],
        ["Ameya-Yokocho", "Ameyoko Ueno"],
        ["ameyoko", "ameya", "ueno market"],
        "You are under the JR tracks between Ueno and Okachimachi.",
        "Shade under the tracks. Stalls are lit by their own bulbs. Midday sun hits the open ends of the market.",
        [
            fr("track|arcade|market", "Under the tracks",
               "Stand in the middle of the market and shoot along the stalls. The tracks or the roof make a ceiling.",
               "Closer on one stall: fish, shoes, or dried food fills the frame. Cut off people's faces.",
               "Mixed light. Let the stall bulb be the bright spot. Do not wait for even sun.",
               "You can be in profile buying something. The seller stays out of the close frame unless they agree.",
               "Hold the camera at the goods, not at eye height.",
               "Take it when a hand reaches into the frame, or when the stall is still."),
            fr("stall|shop", "One stall front",
               "Square to the stall, camera at the price cards and the pile of goods.",
               "From the side, so the stall recedes and the next stall is behind it.",
               "The bulb over the stall. If the goods are black, step until that bulb hits them.",
               "Your hands in the bottom of the frame, holding what you bought.",
               "Focus on the nearest item.",
               "One frame only if the next stall is the same picture."),
        ],
    ),
    place(
        "ueno",
        "Ueno Park",
        "Day 2",
        ["Ueno Park", "Ueno"],
        ["Ueno Park Tokyo", "Shinobazu Pond"],
        ["ueno", "shinobazu", "benten"],
        "You are in the park above the museum steps, or on the path around Shinobazu pond.",
        "Open daylight on the paths. The pond reflects a bright sky. Late afternoon is the kinder light on the trees.",
        [
            fr("pond|shinobazu|lotus", "Shinobazu pond",
               "From the path, camera at your chest, the water in the lower half and the shrine or trees on the far side.",
               "Lower, near the rail, so the lotus or the water fills the frame and the far shore is a thin line.",
               "If the water is white, turn so a dark tree is the reflection. Do not include the white sky.",
               "A person on the path, walking, small, at the edge.",
               "Keep the horizon level.",
               "Take one wide and one of the water only."),
            fr("steps|museum|park", "Park steps",
               "From the bottom of the wide steps, camera low, the steps leading up and people small at the top.",
               "From the top, looking down the steps into the trees.",
               "Sun on the steps, shade in the trees. Expose for the steps if someone is standing on them.",
               "Sit on a step, side on, looking across the park, not at the lens.",
               "Leave the center of the stairs clear.",
               "Take it when the stairs are not a tour group."),
        ],
    ),
    place(
        "gyoen",
        "Shinjuku Gyoen",
        "Day 2",
        ["Shinjuku Gyoen"],
        ["Shinjuku Gyoen"],
        ["gyoen", "shinjuku gyoen", "shinjuku imperial"],
        "You are inside the garden, on a lawn or a path, not on the street outside.",
        "Late afternoon, low sun through the trees. Hard midday sun on the lawn is the worse light. Shade under a tree works for a person.",
        [
            fr("lawn|garden|greenhouse", "Lawn and the greenhouse",
               "Stand on the lawn, camera at your eyes, the greenhouse or a tree at one third. Leave ground in front.",
               "Lie or sit so the grass fills the bottom and the sky is a strip.",
               "Sun from the side, not from behind the lens. A cloud is fine. Wait if faces are in black shadow.",
               "One person sits or lies on the grass, looking away, at the trees.",
               "Do not put them in the exact center.",
               "Take one with them small in the garden, one closer on the face in open shade."),
            fr("path|tree|taiwan", "Tree tunnel path",
               "In the middle of a straight path, camera at your chest, the trees meeting over the path.",
               "Step off the path and shoot along it, so the path is a line at the edge.",
               "Dappled light. A patch of sun on the path is the bright spot. If the patches are a mess on a face, move the person into shade.",
               "Walk away from the camera down the path.",
               "Take it as they pass through a sun patch, or fully in shade. Not half and half.",
               "One frame."),
        ],
    ),
    place(
        "tmg",
        "Tokyo Metropolitan Government Building",
        "Day 2",
        ["Tokyo Metropolitan Government Building", "Met Gov", "Tokyo Metropolitan Government Building · South 45F"],
        ["Tokyo Metropolitan Government Building observatory", "Shinjuku skyline TMG"],
        ["metropolitan", "tocho", "都庁", "observatory", "tmg"],
        "You are on the South observatory, or on the plaza looking up at the twin towers.",
        "Sunset is the reason you are here. Be at the glass before 16:20. The city goes from sun to lights in about forty minutes.",
        [
            fr("observatory|skyline|sunset|view", "City from the South deck",
               "At the glass, camera close to it so room lights do not reflect. The horizon sits in the lower third. Mount Fuji is west if the air is clear.",
               "Point down at the streets so the towers below fill the frame. The horizon can leave the picture.",
               "The hour before sunset, then the blue time after, when the offices are lit and the sky is still blue. Not full night.",
               "A person stands at the glass, in profile, small, looking out. Not a selfie in the reflection.",
               "Put the lens almost on the glass.",
               "Take one frame before sunset and one when the lights are on and the sky is still blue."),
            fr("building|tower|plaza", "The twin towers from the plaza",
               "On the plaza, camera low, pointed up, one tower filling the frame.",
               "Step back until both towers fit, with the plaza in the foreground.",
               "Late sun on the west faces. If both towers are grey, wait for the sun to hit one edge, or shoot them against a deep sky.",
               "A person walking across the plaza, small, gives the scale.",
               "Keep the verticals as straight as you can. A little lean from pointing up is fine.",
               "One low frame, one with both towers."),
        ],
    ),
    place(
        "golden-gai",
        "Golden Gai",
        "Day 2",
        ["Golden Gai", "Omoide Yokocho", "Hanazono"],
        ["Golden Gai Shinjuku", "Omoide Yokocho"],
        ["golden gai", "黄金街", "omoide", "memory lane", "yakitori alley"],
        "You are in the alleys east of Kabukicho, after dinner.",
        "Night. The lanterns are the light. Shoot while the sky is still a little blue if you can. Later, the signs have to do all the work.",
        [
            fr("alley|lantern|bar", "Alley of lanterns",
               "At the entrance of an alley, camera at your chest, looking down the narrow gap. Signs on both sides.",
               "Closer, one lantern and one door. Leave the rest of the alley out.",
               "Lantern light, warm. If a sign is pure white and huge, keep it at the edge, not the middle.",
               "Two people can stand in a doorway, talking, not looking at you. Do not shoot into a bar.",
               "Ask before you point a camera through a door.",
               "Take the alley, then one door."),
            fr("omoide|yakitori|smoke", "Omoide Yokocho smoke",
               "Under the tracks, camera at the smoke and the red lanterns, from the aisle.",
               "Close on a skewer or a lantern, the aisle soft behind it.",
               "Smoke in front of a lamp is the picture. Move until the lamp is behind the smoke.",
               "You can sit and shoot your own food. Other tables are not the subject.",
               "Keep the camera low, at the table.",
               "One frame of the aisle, one of the plate."),
        ],
    ),
    place(
        "shibuya-sky",
        "Shibuya Sky",
        "Day 3",
        ["Shibuya Sky", "Sky"],
        ["Shibuya Sky rooftop", "Shibuya Sky observatory"],
        ["shibuya sky", "sky deck", "scramble square"],
        "You are on the open roof, 14F entrance, morning slot.",
        "Morning, sun higher than the deck. Faces in the open will squint. Put a person in the shade of a screen, or shoot the city and leave faces out.",
        [
            fr("roof|deck|skyline|edge", "Roof edge and the city",
               "At the outer glass, camera at your chest, the edge in the lower third and the city beyond. Include the scramble if you can see it.",
               "Point straight down at the crossing. The people are dots. The roads make the shape.",
               "Clear morning. If the city is white haze, shoot down at the crossing instead of at the horizon.",
               "One person stands at the edge, back to you, hands on the rail, looking out.",
               "Do not have them face the sun.",
               "Take the wide city, then the person small against it."),
            fr("scramble|crossing|down", "Straight down at the crossing",
               "Lens over the edge, straight down. The crossing fills the frame when the light is red and people are in the box.",
               "Same spot, tipped so the Shibuya sign or a train is in the corner.",
               "Daylight from above. The street is the subject, not the sky.",
               "No pose. This frame is the crossing.",
               "Wait for the crowd to be in the middle of the crossing, not on the curbs.",
               "Take three. Keep the one where the white stripes are visible."),
        ],
    ),
    place(
        "scramble",
        "Shibuya crossing",
        "Day 3",
        ["Scramble", "Hachiko", "MAGNET 7F", "Shibuya", "Shibuya Crossing"],
        ["Shibuya Crossing", "Hachiko statue", "Shibuya scramble"],
        ["shibuya", "hachiko", "scramble", "crossing"],
        "You are at the crossing, or one floor up at MAGNET, after Sky.",
        "Daylight. The crossing works in sun or cloud. The Hachiko statue is better when the sun is not flaring straight into the lens.",
        [
            fr("crossing|scramble|intersection", "The crossing from the street",
               "On a corner, camera at your chest, as the light changes and people walk. Include the buildings, not just heads.",
               "From MAGNET 7F, through the glass or from the balcony, looking down on the stripes.",
               "Even daylight. Signs are bright. If a screen is blown white, keep it at the edge.",
               "Stand still on the corner. Or walk in the crowd and shoot ahead, not at faces.",
               "From the balcony, put the camera on the glass.",
               "Take the moment the crossing is full."),
            fr("hachiko|statue", "Hachiko",
               "From the side, camera at the dog's head height, the station behind. Not from the front of the crowd.",
               "Closer, the dog's head and the collar, the crowd only a blur.",
               "Open shade under the station roof. If the bronze is black, step until a little sky light hits the face of the dog.",
               "A person crouches beside the dog, looking at it, not at you. The crowd will be in the picture. That is the place.",
               "Focus on the dog.",
               "Take two from the side."),
        ],
    ),
    place(
        "ginza",
        "Ginza",
        "Day 3",
        ["Ginza", "UNIQLO Ginza", "Itoya", "Ginza Six", "Wako"],
        ["Ginza Tokyo street", "Wako Ginza", "Ginza Six"],
        ["ginza", "wako", "銀座"],
        "You are on Chuo-dori between the flagship shops, before Tokyo Tower.",
        "Afternoon. The street is a canyon. Sun hits one side. Shoot the lit side, or stand in the shade and look along the street.",
        [
            fr("wako|clock|chuo", "Wako clock and the street",
               "On the crossing by Wako, camera at your eyes, the clock tower at one side and the street running off.",
               "Closer on the clock, pointed up, the round face filling the frame.",
               "Afternoon sun on the stone. If the tower is in shade, shoot along the sunny side of the street instead.",
               "A person waits at the crossing, in profile.",
               "Keep the clock sharp.",
               "Take one with the street, one of the clock."),
            fr("street|night|neon|facade", "Shopfronts along Chuo-dori",
               "From the sidewalk, camera at your chest, shooting down the row of flags and windows.",
               "One window: Uniqlo, Itoya, or a department store display, square to the glass. Kill the reflection by stepping sideways.",
               "Window light. Reflections of the sky mean you move. The display should be brighter than the street behind you.",
               "Your reflection can stay out. A person walking past the window, soft, is enough.",
               "Focus on the goods in the window, or on the building line.",
               "One street frame, one window."),
        ],
    ),
    place(
        "tower",
        "Tokyo Tower",
        "Day 3",
        ["Tokyo Tower", "Zōjō-ji", "Zojoji"],
        ["Tokyo Tower", "Zojoji Tokyo Tower"],
        ["tokyo tower", "東京タワー", "zojo", "zōjō", "増上寺"],
        "You are at the tower for dusk, then at the temple gate next to it.",
        "Arrive so you are looking at the tower around sunset. The red against a pale sky is the first frame. The lit tower against a deep sky is the second.",
        [
            fr("tower|dusk|night|red", "Tower at dusk",
               "From the plaza or the street to the east, camera at your eyes, the whole tower in the frame with ground under it.",
               "Closer, or a longer view, so the tower fills the height of the picture and the sky is only the corners.",
               "The twenty minutes after sunset. The tower lights are on and the sky is still blue. Full night the sky is black and the tower is a sticker.",
               "A person in the foreground, small, looking up, not a flash photo.",
               "No flash.",
               "Take one while the sky is pale and one when it is deep blue."),
            fr("zojo|gate|temple", "Zōjō-ji gate with the tower",
               "Stand so the temple gate frames the tower. Camera at your eyes. The gate is the dark shape, the tower sits in the opening.",
               "Under the gate, looking up through it, the tower off to one side.",
               "The gate is in shade, the tower is lit. Expose so the tower is not a white blob and the gate is still a shape, not a black hole. If you cannot have both, expose for the tower and let the gate be a silhouette.",
               "Stand inside the gate, back to the camera, looking at the tower.",
               "Hold the camera straight.",
               "Step left or right until the tower sits in the opening."),
        ],
    ),
    place(
        "roppongi",
        "Roppongi",
        "Day 3",
        ["Roppongi Hills", "Tokyo Midtown"],
        ["Roppongi Hills Mori Tower", "Tokyo Midtown"],
        ["roppongi", "mori tower", "midtown", "六本木"],
        "You are inside Roppongi Hills or Tokyo Midtown, after dinner, not on the crossing with the touts.",
        "Night, lights in the buildings. Shoot from inside the complex. The lit towers against the sky, or the street one floor below.",
        [
            fr("mori|hills|tower|spider", "Mori Tower from the plaza",
               "On the Hills plaza, camera low, the tower going up. The spider sculpture can sit in the foreground if you are near it.",
               "From a balcony inside the complex, looking across at the tower and down at the street.",
               "Building light. Blue hour if you are early enough. Later, let the windows be the bright part and keep the sky out if it is black.",
               "You and one other person walking, small. Do not pose with anyone who approaches you on the street.",
               "Stay in the complex.",
               "One frame of the tower, one looking down."),
            fr("midtown|garden|lights", "Midtown garden",
               "On a path in the Midtown garden, camera at your chest, lights in the trees and the building behind.",
               "Close on one lit tree or a window grid.",
               "Small lights in the dark. If the picture is black, move until a lamp is in the frame.",
               "Walk. Do not stop in the middle of a group.",
               "Take two so one is sharp.",
               "Keep walking if anyone asks you to come with them."),
        ],
    ),
    place(
        "takao",
        "Mt. Takao",
        "Day 4",
        ["Mt. Takao", "Trail 1", "Yakuo-in", "Takaosan"],
        ["Mount Takao Yakuoin", "Takaosan summit view"],
        ["takao", "高尾", "yaku"],
        "You are on Trail 1, at Yakuo-in, or at the summit.",
        "Morning on the trail is shade under trees. The summit view needs a clear west for Fuji. If Fuji is in cloud, shoot the temple and the forest instead.",
        [
            fr("trail|forest|cedar|path", "Trail under the trees",
               "On the path, camera at your chest, the steps or the dirt going up through the trunks.",
               "Close on one trunk and the light between trees. The path can leave the frame.",
               "Shade with spots of sun. Do not put a face in a sun spot. Walk-and-shoot in the shade.",
               "The person ahead of you on the trail, back to you, is the pose. You do not need to stop them.",
               "Keep the camera dry if the path is wet.",
               "One frame of the path, one of the person small ahead."),
            fr("yaku|temple|summit|fuji|view", "Yakuo-in, then the view",
               "At the temple, camera at your eyes, the hall and the lanterns. Then at the summit, the view with the horizon low.",
               "Point up at the temple roof, or, on the summit, a tighter piece of the ridge without the whole sky.",
               "The temple is open shade. The summit is hard light. If Fuji is a faint shape, it will not read. Shoot the ridge instead.",
               "At the summit, stand to the side of the view, profile, small. Do not block the rail.",
               "Temple first, view if it is clear.",
               "One frame each. Then walk."),
        ],
    ),
    place(
        "chureito",
        "Chureito and Kawaguchiko",
        "Day 4",
        ["Chureito", "Kawaguchiko", "Lake Kawaguchi", "Oishi Park", "Shimoyoshida", "Chureito Pagoda"],
        ["Chureito Pagoda", "Arakurayama Sengen Park", "Lake Kawaguchi Fuji"],
        ["chureito", "arakura", "kawaguchi", "kawaguchiko", "oishi", "sengen"],
        "You are at the pagoda above Shimoyoshida, then at the lake if you stay.",
        "You arrive mid-morning, so this is not sunrise. Sun on the pagoda, Fuji behind it if the mountain is out. If Fuji is cloud, the pagoda and the stairs are still the picture.",
        [
            fr("pagoda|chureito|fuji", "Pagoda with Fuji behind it",
               "From the classic terrace below the pagoda, camera at your eyes. The pagoda sits left or right, Fuji behind it. Leave the mountain whole, including the base.",
               "From the side of the terrace, the pagoda larger, Fuji still in the frame if it is visible.",
               "Morning sun on the red pagoda. Fuji is often paler than the pagoda. If the mountain is gone, do not wait the day away. Shoot the pagoda against the sky.",
               "A person on the terrace, small, looking at the mountain, not at you. The rail is crowded. Step to the end of it.",
               "Hold the camera level so Fuji is not leaning.",
               "Take several. The mountain can fade between frames."),
            fr("stair|step|torii", "The stairs",
               "From the bottom of a flight, camera low, the stairs and the red rail going up.",
               "From a landing, looking down the stairs through the trees.",
               "Shade on the stairs, sun on the upper gate. Both are fine. A face in dappled light is not. Shoot the stairs, not a portrait on them.",
               "Someone climbing, from behind, small.",
               "You will be out of breath. Stop, then take it.",
               "One up, one down."),
            fr("lake|kawaguchi|oishi|shore", "Lake with Fuji",
               "At the north shore or Oishi, camera at your chest, the lake in the lower half and Fuji centered if it is out.",
               "Lower, at the grass or the flowers, so the near ground is big and the mountain is small.",
               "Midday on the lake is harsh. Fuji in cloud is a grey wall. If you can see the snow line, shoot. If you cannot, shoot the shore and leave.",
               "A person at the water, back to you, small.",
               "Keep the horizon straight.",
               "One with the mountain, or one of the shore if the mountain is gone."),
        ],
    ),
    place(
        "palace",
        "Imperial Palace",
        "Day 5",
        ["Imperial Palace", "Imperial Palace outer loop", "Imperial Palace outer", "Imperial Palace run"],
        ["Imperial Palace Tokyo moat", "Nijubashi Bridge"],
        ["imperial palace", "nijubashi", "皇居", "seimon", "palace"],
        "You are on the outer moat loop, early, before Akiba.",
        "Just after sunrise the water is calm and the paths are empty. Sun comes up over the east side of the moat. The west side stays blue longer.",
        [
            fr("moat|bridge|nijubashi|gate", "Bridge and the moat",
               "At Nijubashi, camera at your eyes, the bridge and the gate across the water. Include the reflection if the water is still.",
               "Lower, on the wall, so the water is half the frame.",
               "Early sun. If the bridge is a silhouette, walk until the sun is on the stone, or accept the silhouette and keep the sky simple.",
               "You are running. Stop for one minute. A person on the bridge path, small, walking, is enough. Do not block the view.",
               "Keep the horizon level.",
               "One frame, then keep running."),
            fr("pine|wall|run", "The outer path",
               "On the gravel path, camera at your chest, the wall or the pines going away.",
               "Close on the pine trunks and the water behind them.",
               "Low morning sun between the trees. Shoot along the path, not into the sun, unless you want the path in shadow and the edges bright.",
               "The runner ahead of you, from behind.",
               "Do not stop in the middle of the path.",
               "One frame."),
        ],
    ),
    place(
        "akiba",
        "Akihabara",
        "Day 5",
        ["Akihabara", "Akiba", "Radio Kaikan", "Maidreamin", "Muscle Kitchen", "GiGO", "Animate"],
        ["Akihabara electric town", "Akihabara Radio Kaikan"],
        ["akihabara", "akiba", "秋葉原", "radio kaikan"],
        "You are on the main street and in the side alleys, late morning.",
        "The street is shade from the buildings, with bright signs. Shoot the signs. For a person, stand them in the shade, not under a white sign.",
        [
            fr("street|electric|sign|wire", "The main street",
               "In the middle of a side crossing, camera at your chest, signs overhead and the street going back.",
               "Point up. Signs and wires fill the frame. Leave the road out.",
               "Daytime signs are on. They are the color. If the sky is white, keep it to a small gap.",
               "Walk. A photo of you looking up is enough. Do not stop in the road.",
               "Hold the camera straight if you can. A little upward lean is the point of the second frame.",
               "One down the street, one straight up."),
            fr("kaikan|arcade|building", "Radio Kaikan and a shopfront",
               "From across the street, the building and its signs. Then one floor inside: a shelf, not a stranger's face.",
               "Close on one figure box or one sign, the rest soft.",
               "Indoor shop light is yellow. Let it be yellow. No flash.",
               "Your hands holding one box you might buy. Staff stay out of the picture.",
               "Ask if a shop has a no-photo sign. Leave if it does.",
               "One of the building, one of a shelf."),
            fr("maid|cafe|muscle|table", "Your table",
               "At Maidreamin or Muscle Kitchen, camera looking down at the plate and the drink. The table fills the frame.",
               "From your seat, the room and the counter, no faces of staff.",
               "Indoor light, dim. Put the plate near the brightest lamp on the table.",
               "Your group only. The staff are working. Leave them out.",
               "No flash.",
               "One frame of the food, then eat."),
        ],
    ),
    place(
        "nakano",
        "Nakano Broadway",
        "Day 5",
        ["Nakano Broadway", "Nakano", "Mandarake"],
        ["Nakano Broadway"],
        ["nakano broadway", "中野ブロードウェイ", "mandarake nakano"],
        "You are in the covered mall above the station, afternoon.",
        "Indoor corridors, mixed shop light. The interesting frames are a corridor, a window of figures, and one thing in your hand.",
        [
            fr("corridor|mall|sign", "The corridor",
               "Stand at the end of a corridor, camera at your chest, the shops going away.",
               "One shop window, square on, figures or records filling the glass.",
               "Dim corridor, bright window. Expose for the window. Let the corridor be dark.",
               "You in the corridor, small. Do not photograph into a changing room or a person's face at a stall.",
               "Check for a no-photo sign.",
               "One corridor, one window."),
            fr("figure|mandarake|shelf", "A shelf",
               "Close, one shelf, camera square to it. One figure or one stack of books sharp.",
               "Your hand holding the thing you are thinking about, the shelf soft behind.",
               "The shelf light. Step until the glare leaves the plastic.",
               "Hands only.",
               "One frame.",
               "Put it back or buy it. Do not shoot the whole shop."),
        ],
    ),
    place(
        "hakone-museum",
        "Hakone Open-Air Museum",
        "Day 6",
        ["Open-Air Museum", "Hakone Open-Air Museum"],
        ["Hakone Open-Air Museum"],
        ["open-air museum", "hakone museum", "彫刻の森"],
        "You are on the lawn among the sculptures.",
        "Open daylight on grass. A sculpture against the sky works. A person belongs in the shade of a piece, or small on the lawn.",
        [
            fr("sculpture|lawn|museum", "One sculpture on the lawn",
               "Far enough back that the whole piece and some grass fit. Camera at your eyes. The sky is not the subject.",
               "Closer, a detail of the piece, the garden soft behind.",
               "Side sun so the sculpture has a shadow on the grass. Flat cloud is fine if the shape is strong.",
               "A person next to the piece, small, so the size is clear. They look at the work.",
               "Do not climb the art.",
               "One whole, one detail."),
            fr("path|foot|garden", "The path between pieces",
               "On a path, camera at your chest, a piece at the end of the path.",
               "Low, grass in the foreground, the next sculpture small.",
               "Sun on the path. If it is harsh, shoot toward a shaded piece.",
               "Walk away from the camera.",
               "One frame.",
               "Then the next piece."),
        ],
    ),
    place(
        "owakudani",
        "Owakudani",
        "Day 6",
        ["Owakudani"],
        ["Owakudani Hakone", "Hakone Ropeway"],
        ["owakudani", "大涌谷", "ropeway", "hakone rope"],
        "You are at the volcanic valley, off the ropeway.",
        "Steam, white and thick. It shows against a darker hill. Midday sun on the steam can wipe it out. Shoot the steam against rock or a dark slope.",
        [
            fr("steam|valley|sulfur|egg", "Steam in the valley",
               "From the viewing deck, camera at your eyes, steam rising in front of the hill. Include the rail so the drop is clear.",
               "Tighter on a vent, the steam filling the frame.",
               "The steam is the bright part. If it is a white blob with no shape, wait for a thinner puff, or put a dark hill behind it.",
               "A person at the rail, small, looking out. Not on the wrong side of a barrier.",
               "The smell is strong. Take the frame and step back.",
               "One wide, one of the steam."),
            fr("ropeway|gondola", "The ropeway",
               "A gondola crossing the frame, the valley under it. Camera follows the cable.",
               "From inside the gondola, the valley through the glass. Put the lens on the glass.",
               "Daylight. The yellow gondola against green or grey hill is the color.",
               "No pose needed. Your hand on the rail inside the car is enough.",
               "Take two through the glass so one is sharper.",
               "One from the platform, one from the car."),
        ],
    ),
    place(
        "hakone-torii",
        "Hakone Shrine",
        "Day 6",
        ["Hakone Shrine", "Hakone Shrine torii", "Lake Ashi"],
        ["Hakone Shrine torii lake", "Lake Ashi Hakone"],
        ["hakone shrine", "hakone jinja", "箱根神社", "lake ashi", "ashi"],
        "You are at the red gate in the water, then you leave for Yumoto.",
        "Afternoon on the lake. The gate is red against grey-green water. A bright hazy sky kills it. Put the gate against the hill or the water, not against a white sky.",
        [
            fr("torii|gate|water|lake", "The gate in the water",
               "From the shore, camera at your eyes, the whole gate and its reflection if the water is calm. Leave space around it.",
               "Closer, along the shore, so the gate is large and the lake is behind it. Or from the side, one pillar.",
               "Soft afternoon, or the gate in shade with the hill behind. If the sky is white, crop it out by aiming lower.",
               "A person on the dock, small, not standing in front of the gate.",
               "The dock is crowded. Step to the side.",
               "Take several. Pick the one where the gate is not behind a head."),
            fr("shrine|steps|cedar", "The shrine above the lake",
               "On the steps, camera low, looking up at the hall through the trees.",
               "From the hall, looking back down toward the lake.",
               "Shade under the cedars. That is the right light. Do not use flash in the hall.",
               "Walk up. A photo from behind, on the steps.",
               "One frame.",
               "Then go. You need to be in Yumoto for dinner."),
        ],
    ),
    place(
        "nishiki",
        "Nishiki Market",
        "Day 7",
        ["Nishiki", "Nishiki Market"],
        ["Nishiki Market Kyoto"],
        ["nishiki", "錦市場"],
        "You are in the covered market lane, late afternoon, after the train.",
        "The lane is dim, stalls are bright. Shoot the food, not a wall of faces. Eat at the stall. Do not walk while eating.",
        [
            fr("lane|market|arcade", "Down the lane",
               "In the middle of the lane, camera at your chest, the roof and the stalls going away.",
               "One stall, close, the food filling the frame.",
               "Stall light on the fish or the pickles. If it is dark, move until the bulb is on the food.",
               "Your hands and the sample you were given. The seller only if they are fine with it. A nod is the ask.",
               "Focus on the food.",
               "One lane, one stall."),
            fr("food|grill|oyster|pickle", "Food at the stall",
               "Looking down at the skewer or the oyster in your hand, the stall soft behind.",
               "Across the stall at the grill, flames small in the frame.",
               "Warm stall light. Let it be warm.",
               "You, eating, from the side, taken by the other person. Not a flash in a cook's face.",
               "One frame, then eat.",
               "Step out of the lane to stand."),
        ],
    ),
    place(
        "gion",
        "Gion and Yasaka",
        "Day 7",
        ["Gion", "Yasaka", "Pontocho"],
        ["Yasaka Shrine", "Gion Kyoto Hanamikoji", "Pontocho"],
        ["yasaka", "gion", "八坂", "祇園", "pontocho", "hanamikoji"],
        "You are at Yasaka, then in the lanes south of it. Look. Do not chase geisha.",
        "Dusk. The lanterns come on while the sky is still light. That is the frame. Later it is only lamps.",
        [
            fr("yasaka|lantern|shrine|gate", "Yasaka lanterns",
               "In front of the shrine gate, camera at your eyes, the lanterns and the gate. People will be in it. Keep them small.",
               "Closer, one lantern sharp, the gate soft.",
               "Dusk, sky still pale, lanterns lit. If the sky is black, the lantern is the whole picture. Come in close.",
               "Stand to the side of the worship path.",
               "No flash at the shrine.",
               "One wide, one lantern."),
            fr("hanamikoji|lane|machiya", "A Gion lane",
               "At the end of a lane, camera at your chest, wooden fronts and lanterns going away.",
               "One doorway, the lantern beside it.",
               "Lantern light on wood. If a lantern is behind the person, their face will be black. Have them stand beside the light, not under it with the lamp behind their head.",
               "Walk. Do not follow anyone in kimono. If you want a person in the frame, use your own group, from behind, small.",
               "Stay on the street. Do not step into a doorway.",
               "One lane, one door."),
            fr("pontocho|canal|night", "Pontocho",
               "On the lane, camera at your chest, the noren and the lights. Or from the canal side, the backs of the restaurants.",
               "Close on one noren and the light under it.",
               "Night, warm doorways. Shoot the doorway, not into the restaurant.",
               "Your group on the lane, walking away.",
               "One frame.",
               "Then dinner."),
        ],
    ),
    place(
        "bamboo",
        "Arashiyama bamboo",
        "Day 8",
        ["Arashiyama", "Arashiyama Bamboo Grove", "Arashiyama bamboo", "Togetsukyo"],
        ["Arashiyama Bamboo Grove", "Togetsukyo Bridge"],
        ["bamboo", "arashiyama", "嵯峨野", "togetsu"],
        "You are in the bamboo at opening, then at the river if you have time.",
        "Be at the grove at 08:00. The light is green shade. Sun through the tops is the bright part. Later the path is people.",
        [
            fr("bamboo|grove|path", "The bamboo path",
               "In the middle of the path, camera at your eyes, the stalks going up and meeting overhead. Hold it straight.",
               "Point up. Stalks and sky gaps. No path.",
               "Green shade. A flare of sun at the top is good. A face in that flare is not. Shoot the grove, or a person fully in the green shade.",
               "One person walking away, small, in the middle of the path.",
               "Go early. If the path is full, point up.",
               "Take three. Keep the straightest one."),
            fr("bridge|togetsu|river", "Togetsukyo",
               "From the bank, the bridge across the frame, the hill behind it. Camera at your eyes.",
               "From the bridge, looking along the river, the near rail in the corner.",
               "Morning sun on the hill, the river darker. If the hill is hazy, the bridge shape is enough.",
               "A person on the bank, not in the middle of the bridge photo.",
               "One frame.",
               "Then the rest of the day."),
        ],
    ),
    place(
        "tenryuji",
        "Tenryu-ji",
        "Day 8",
        ["Tenryu-ji", "Tenryuji"],
        ["Tenryu-ji garden"],
        ["tenryu", "天龍寺"],
        "You are in the garden, looking at the pond and the hill.",
        "The garden is built for a view from the veranda. That is the camera position. Morning shade, the hill behind the pond.",
        [
            fr("pond|garden|veranda", "Pond from the veranda",
               "Sit or stand on the veranda, camera at your chest, the pond and the hill centered the way the garden is laid out. Do not invent a new angle from the side path first.",
               "From the path, one pine and the pond, tighter.",
               "Soft morning light. The white sand or the sky will blow out. Aim so the hill is the bright part you care about, and let the sand be bright.",
               "No posing on the rocks. A person sitting on the veranda, side on, small.",
               "Stay on the path.",
               "One from the veranda, one detail."),
        ],
    ),
    place(
        "kiyomizu",
        "Kiyomizu-dera",
        "Day 9",
        ["Kiyomizu", "Kiyomizu-dera", "Higashiyama"],
        ["Kiyomizu-dera Kyoto"],
        ["kiyomizu", "清水寺"],
        "You are on the temple balcony and on the path below it, looking up.",
        "Morning, before the balcony is shoulder to shoulder. The wooden stage against the trees is the picture. Sun from the side shows the joinery.",
        [
            fr("stage|balcony|wooden", "The wooden stage",
               "From the path below, camera at your eyes, the whole stage and the trees under it.",
               "Closer, the pillars and the joinery, people left out.",
               "Side light on the wood. If you are on the stage looking out, the view is bright and the balcony is shade. Shoot the view, then turn and shoot a pillar in the shade.",
               "On the balcony, stand at the rail, back to the camera, looking at the trees. Small in a wide frame.",
               "Do not lean out.",
               "One from below, one from the rail."),
            fr("pagoda|gate|lantern", "Gate and pagoda",
               "Through a gate, the next roof centered in the opening. Camera at your eyes.",
               "Point up at the pagoda from the courtyard.",
               "Sun on the orange wood. If it is flat, the shape still works. Keep the sky small.",
               "Walk through the gate. The person ahead, from behind.",
               "One frame.",
               "Then the stage."),
        ],
    ),
    place(
        "sannenzaka",
        "Ninenzaka and Sannenzaka",
        "Day 9",
        ["Ninenzaka", "Sannenzaka", "Ninen/Sannen", "Ishibe-koji"],
        ["Sannenzaka Kyoto", "Ninenzaka", "Ishibe Koji"],
        ["sannenzaka", "ninenzaka", "二年坂", "三年坂", "ishibe"],
        "You are on the stone slopes between Kiyomizu and the lanes.",
        "Daytime, open shade between wooden shops. A little sun on one shopfront is the bright spot. The lanes are prettier before the tour buses fill them.",
        [
            fr("slope|stone|shop", "The stone slope",
               "From the bottom, camera at your chest, the steps going up between the shops.",
               "From the top, looking down the steps.",
               "Shade in the street, sun on the upper shop signs. Shoot up the shaded steps with one lit sign.",
               "A person walking up, from behind, off to one side.",
               "Step out of the walking line to take it.",
               "One up, one down."),
            fr("ishibe|alley|lantern", "Ishibe-koji",
               "At the end of the lane, camera at your eyes, stone and wood going away.",
               "One lantern and one wall.",
               "Dim lane. Let it be dim. A lantern is the bright spot if it is lit. If not, the sky gap at the top of the lane is enough.",
               "Stand still at the side. Do not pose in a private entrance.",
               "One frame.",
               "Walk on."),
        ],
    ),
    place(
        "fushimi",
        "Fushimi Inari",
        "Day 10",
        ["Fushimi Inari", "Fushimi", "Inari"],
        ["Fushimi Inari torii", "Fushimi Inari Taisha"],
        ["fushimi", "inari", "伏見", "千本鳥居"],
        "You are on the torii paths. The famous tunnel is at the start. Higher up is emptier.",
        "Go early. The red reads when a little sun hits one side of the gates and the inside of the tunnel stays dark. Midday the red is flat and the path is full.",
        [
            fr("torii|tunnel|senbon", "The torii tunnel",
               "In the center of the path, camera at your chest, the gates repeating uphill. Hold it straight.",
               "Against one gate, shooting along the row so the nearest gate frames the rest.",
               "Early, sun raking across the red. If both sides are the same dull red, walk until a bend where one side is lit.",
               "One person walking away, in the center, small. Or nobody.",
               "If the path is a crowd, go uphill ten minutes and shoot there.",
               "Take three. Keep the one where the gates make a clean tunnel."),
            fr("shrine|fox|mountain", "A side shrine",
               "Off the main tunnel, one small shrine, fox statues, camera at the statues' height.",
               "Close on one fox, the gates soft behind.",
               "Shade. The stone is grey. A little sun on the fox's face helps. No flash.",
               "Crouch beside the statue, looking at it, if you want a person. Otherwise the statue alone.",
               "Do not touch the statues.",
               "One frame, then back to the path."),
        ],
    ),
    place(
        "nara",
        "Nara Park",
        "Day 10",
        ["Nara Park", "Nara deer park", "Nara"],
        ["Nara Park deer", "Nara Todaiji approach"],
        ["nara", "奈良"],
        "You are in the park between the station and the big temple.",
        "Open daylight. Deer on grass with trees behind them. Do not shoot into a white sky. Get down.",
        [
            fr("deer|bow|park", "Deer on the grass",
               "Kneel so you are at the deer's eye height. Grass in the foreground, trees behind, not sky.",
               "A tighter frame, one deer, the park soft.",
               "Side light. If the deer is a black shape against a bright path, move so the sun is on its side and the background is trees.",
               "You can bow. The deer may bow. Photograph that from the side, another person taking it, so both of you and the deer are in profile.",
               "Do not surround a deer. Do not feed it outside the cracker rules.",
               "Take a few. Keep the one at eye height."),
            fr("path|lantern|lawn", "The park path",
               "A wide path, stone lanterns, deer small, camera at your chest.",
               "One lantern, close, a deer far behind if it happens to be there.",
               "Late morning sun. Shade under a tree for anything with a face, including yours.",
               "Walk. The picture can be the park without you.",
               "One wide frame.",
               "Then the temple."),
        ],
    ),
    place(
        "todaiji",
        "Tōdai-ji",
        "Day 10",
        ["Tōdai-ji", "Tōdai-ji Great Buddha", "Todai-ji"],
        ["Todai-ji Great Buddha", "Nandaimon Nara"],
        ["tōdai", "todai", "東大寺", "nandaimon", "daibutsu", "great buddha"],
        "You are at the south gate, then in the hall with the Great Buddha.",
        "The gate is outdoor daylight. The hall is dark. The Buddha is the bright bronze in a dark room. Expose for the face, and let the rafters go black.",
        [
            fr("nandai|gate|guardian", "Nandaimon gate",
               "From the front, far enough to fit the whole gate, camera at your eyes. The guardians sit in the openings.",
               "Closer, one guardian, camera low, looking up.",
               "Daylight on the wood. The inside of the gate is shade. If the guardian is black, step until some sky light reaches the face. No flash.",
               "A person in the gateway, small, for scale.",
               "One whole gate, one guardian.",
               "Then the hall."),
            fr("buddha|daibutsu|hall", "The Great Buddha",
               "From the front of the hall, camera at your chest, the whole seated figure. Then a tighter frame of the face and the hands.",
               "From the side aisle, the face in profile and the pillars repeating.",
               "Dim hall, lit face. Point at the face. If the picture is a grey mess, you metered the dark roof. Aim lower, at the bronze, and take it again.",
               "You do not pose in front of the Buddha for a full-length photo in the worship space. A small figure at the side, from far back, is the scale shot.",
               "No flash.",
               "One whole, one face."),
        ],
    ),
    place(
        "kasuga",
        "Kasuga Taisha",
        "Day 10",
        ["Kasuga Taisha", "Kasuga"],
        ["Kasuga Taisha lanterns"],
        ["kasuga", "春日"],
        "You are on the lantern path and at the shrine.",
        "The stone lanterns in the moss are shade. A little sun on a lantern top is enough. The bronze lanterns at the building are dim. Let them be dim.",
        [
            fr("lantern|stone|path|moss", "Stone lanterns",
               "On the path, camera at your chest, lanterns repeating into the trees.",
               "One lantern, close, moss at the base.",
               "Forest shade. If a lantern top is in sun and the base is black, that is fine. Do not flash the moss.",
               "Walk the path. A person ahead, small.",
               "Stay on the path.",
               "One row, one lantern."),
            fr("shrine|bronze|hanging", "Hanging lanterns",
               "At the building, camera pointed up at the rows of bronze lanterns.",
               "One lantern, the writing if you can see it, the rest soft.",
               "Porch shade. The metal catches a little light. That glint is what you want.",
               "No pose under the eaves blocking the way.",
               "One frame.",
               "Then leave the park."),
        ],
    ),
    place(
        "kuromon",
        "Kuromon",
        "Day 11",
        ["Kuromon", "Kuromon Ichiba"],
        ["Kuromon Market Osaka"],
        ["kuromon", "黒門"],
        "You are in the market after NICO check-in. Stalls wind down after 16:30.",
        "Covered market, stall bulbs, afternoon. Shoot the food you are about to eat. Prices are tourist prices. The photo is the food, not a pile of wallets.",
        [
            fr("market|stall|arcade", "The market lane",
               "Down the lane, camera at your chest, stalls on both sides.",
               "One stall, the seafood or the fruit filling the frame.",
               "Bulb light on wet fish. That shine is the light. If the lane is dark, the stall is the picture.",
               "You holding a skewer, from the side.",
               "Ask with a gesture before you shoot a cook up close.",
               "One lane, one plate."),
            fr("oyster|grill|fruit", "What you ordered",
               "Looking down, the food in the foreground, the stall behind.",
               "Closer, the food only.",
               "Whatever light is on the counter. Step an inch until the glare leaves the oyster.",
               "Hands in the frame.",
               "One photo, then eat.",
               "Do not walk and eat."),
        ],
    ),
    place(
        "dotonbori",
        "Dotonbori",
        "Day 11",
        ["Dotonbori", "Glico", "Glico sign", "Ebisubashi"],
        ["Dotonbori Glico", "Dotonbori canal night"],
        ["dotonbori", "道頓堀", "glico", "ebisu"],
        "You are on the canal and the bridge, evening.",
        "Wait until the signs are on and the sky is still a little light, if you arrive early enough. Full night also works. The signs are the light. Do not use flash.",
        [
            fr("glico|sign|bridge", "The Glico sign",
               "From Ebisubashi, camera at your eyes, the running man and the canal. Put the sign off-center and include the water.",
               "Tighter, the sign only, from the bridge.",
               "The sign is brighter than the sky. If the runner is a white blob, you are too close or the picture is overexposed. Step back and take it again so the red and the blue stay colors.",
               "You on the bridge, small, to the side, not blocking the sign for a stranger's photo.",
               "Hold the camera level.",
               "Take a few as the crowd shifts. Pick the one with space around the sign."),
            fr("canal|neon|boat", "The canal",
               "From the bridge, looking along the canal, signs on both sides, water at the bottom.",
               "From the riverside walk, one row of signs reflected if the water is calm.",
               "Neon on the buildings, dark water. The reflection is a bonus, not a requirement.",
               "Walk. A photo from behind your group on the bridge.",
               "No flash.",
               "One along the canal, one of the sign."),
            fr("takoyaki|food|street", "Food on the street",
               "The tray in your hand, the signs soft behind. Camera looking down.",
               "Closer, the food only.",
               "Sign light from above. It is uneven. That is fine.",
               "Hands and the tray. Eat on the side, not in the middle of the bridge.",
               "One frame.",
               "Then the club if you are going. Out by about 01:30."),
        ],
    ),
    place(
        "shinsekai",
        "Shinsekai",
        "Day 12",
        ["Shinsekai", "Tsutenkaku", "Janjan-yokocho"],
        ["Tsutenkaku", "Shinsekai Osaka"],
        ["shinsekai", "tsutenkaku", "通天閣", "新世界"],
        "You are in Shinsekai in the morning, tower and the lanes.",
        "Morning is quiet and the tower is a clean shape. The lanes are better later, when the lanterns are on. If you are here in the morning, shoot the tower and the empty street, and come back at night only if the day allows.",
        [
            fr("tsutenkaku|tower", "Tsutenkaku",
               "From the street south of the tower, camera at your eyes, the whole tower and some street under it.",
               "Low, pointed up, the tower filling the frame.",
               "Morning sun on one side of the tower. A grey sky is fine if the tower is sharp against it.",
               "A person on the street, small, for scale.",
               "Keep it as straight as you can.",
               "One whole, one looking up."),
            fr("janjan|lantern|alley", "The lane under the tower",
               "Down Janjan-yokocho, camera at your chest, signs and the tower if it peeks in.",
               "One shopfront, kushikatsu or a lantern.",
               "Morning shade in the lane. At night the lanterns do the work. Use whichever you are actually standing in.",
               "Your group at a stall, the food in front, not a flash at the cook.",
               "One lane, one stall.",
               "Morning is enough if you will not be back."),
        ],
    ),
    place(
        "osaka-castle",
        "Osaka Castle",
        "Day 12",
        ["Osaka Castle"],
        ["Osaka Castle"],
        ["osaka castle", "大阪城"],
        "You are on the grounds, looking at the tower.",
        "Daylight. The white walls and gold trim need sun on the face you are photographing. Walk until the sun is on the wall, not behind the tower.",
        [
            fr("castle|keep|moat", "The tower across the moat",
               "From the outer grounds, camera at your eyes, the tower and the moat or the wall. Leave ground in front.",
               "Closer, at the inner gate, the tower filling the frame, pointed up a little.",
               "Sun on the white wall. If the tower is grey against a white sky, walk to the other side or crop the sky by aiming lower.",
               "A person on the path, small, walking.",
               "The grounds are large. Take the frame when the tower looks big, not from the far gate if it is a speck.",
               "One wide, one closer."),
            fr("gate|wall|stone", "A gate and the stone wall",
               "Square to a gate, camera at your eyes, the stone base and the plaster above.",
               "Close on the stones, the gold fitting, or one roof corner.",
               "Side light shows the stones. Flat light is dull. Move until a shadow sits in the joints.",
               "No pose needed.",
               "One frame.",
               "Then the rest of the day."),
        ],
    ),
]


def strip_html(value: str) -> str:
    text = TAG.sub(" ", unescape(value or ""))
    return re.sub(r"\s+", " ", text).strip()


def clean_title(title: str) -> str:
    name = title.split(":", 1)[-1]
    name = re.sub(r"\.[A-Za-z0-9]{2,5}$", "", name)
    name = name.replace("_", " ")
    parts = []
    for part in re.split(r"\s*[|,;/]\s*|\s+-\s+", name):
        words = []
        for word in part.split():
            if DATE.match(word):
                continue
            if re.fullmatch(r"\d+", word):
                continue
            words.append(word)
        piece = " ".join(words).strip(" -")
        if piece:
            parts.append(piece)
    return parts[0] if parts else name.strip()


def opener():
    return urllib.request.build_opener()


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as res:
                return json.loads(res.read().decode())
        except Exception as exc:
            if attempt == 3:
                print(f"  search failed: {exc}")
                return {}
            time.sleep(1.5 * (attempt + 1))
    return {}


def search(query: str, limit: int = 40):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": "900",
        "iiextmetadatafilter": "Artist|LicenseShortName",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = fetch_json(url)
    pages = (data.get("query") or {}).get("pages") or {}
    found = []
    for page in pages.values():
        title = page.get("title") or ""
        if SKIP_TITLE.search(title):
            continue
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        mime = info.get("mime") or ""
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        meta = info.get("extmetadata") or {}
        license_name = strip_html((meta.get("LicenseShortName") or {}).get("value", ""))
        if re.search(r"non-?free|fair use|all rights reserved", license_name, re.I):
            continue
        thumb = info.get("thumburl") or info.get("url")
        if not thumb:
            continue
        found.append({
            "title": title,
            "url": thumb,
            "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
            "artist": strip_html((meta.get("Artist") or {}).get("value", ""))[:140],
            "license": license_name or "Wikimedia Commons",
            "mime": mime,
        })
    return found


def matches_place(item, needles):
    hay = item["title"].lower()
    return any(n in hay for n in needles)


def download(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            blob = res.read()
    except Exception as exc:
        print(f"    skip download {exc}")
        return False
    if len(blob) < 8000 or blob[:1] == b"<":
        return False
    if blob[:2] == b"\xff\xd8":
        ext = ".jpg"
    elif blob[:8] == b"\x89PNG\r\n\x1a\n":
        ext = ".png"
    elif blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
        ext = ".webp"
    else:
        return False
    dest = dest.with_suffix(ext)
    dest.write_bytes(blob)
    return dest.exists()


def score(frame, item) -> int:
    hay = item["title"].lower()
    return sum(1 for key in frame["keys"] if key in hay)


def extra_frame(place, item, index: int):
    subject = clean_title(item["title"])
    generic = len(subject.split()) < 2 or subject.lower() in place["name"].lower()
    angles = [
        f"Stand where this view of {place['name']} lines up with the reference. Camera at your eyes. Leave a little ground in the frame.",
        f"Come closer than the reference. {subject if not generic else place['name']} should fill the picture. Camera at your chest.",
        f"Hold the camera lower, near your waist, and point up a little. Same place, more sky or more ceiling.",
        f"Step to the side of the obvious spot and shoot along the subject, not straight at it.",
    ]
    angle = angles[index % len(angles)]
    if not generic:
        angle = f"Find {subject}. {angle}"
    return {
        "look": subject if not generic else f"{place['name']}, view {index + 1}",
        "angle": angle,
        "light": place["daylight"],
        "how": [
            place["stand"],
            "Match the reference, then take one step left or right so a stranger is not in the middle.",
            "Take two frames. Keep the sharper one.",
            "If a person is in it, they are your group, looking at the place, not at the lens.",
        ],
    }


def materialize(frame, item, variant: int):
    if variant == 0:
        angle = frame["angle"]
        how = frame["how"]
        look = frame["look"]
    else:
        angle = frame["alt"]
        how = [frame["alt"], *frame["how"][1:]]
        look = frame["look"] + ", closer"
    return {"look": look, "angle": angle, "light": frame["light"], "how": how}


def collect_images(place):
    seen = set()
    pool = []
    for query in place["queries"]:
        for item in search(query):
            if item["title"] in seen:
                continue
            if not matches_place(item, place["needles"]):
                continue
            seen.add(item["title"])
            pool.append(item)
        if len(pool) >= 36:
            break
        time.sleep(0.4)
    return pool[:40]


def build_place(place):
    print(f"{place['id']} …")
    pool = collect_images(place)
    print(f"  {len(pool)} reference photos")
    used = set()
    assigned = {i: [] for i in range(len(place["frames"]))}
    rest = []
    for item in pool:
        best_i = None
        best_s = 0
        for i, frame in enumerate(place["frames"]):
            s = score(frame, item)
            if s > best_s:
                best_s = s
                best_i = i
        if best_i is not None and len(assigned[best_i]) < 2:
            assigned[best_i].append(item)
            used.add(item["title"])
        else:
            rest.append(item)

    shots = []
    folder = OUT_DIR / place["id"]
    folder.mkdir(parents=True, exist_ok=True)

    def add(text, item):
        if len(shots) >= 36:
            return
        stem = folder / f"{len(shots) + 1:02d}"
        # remove a previous partial
        for old in folder.glob(stem.name + ".*"):
            old.unlink()
        if not download(item["url"], stem):
            return
        saved = next(folder.glob(stem.name + ".*"))
        shots.append({
            "id": f"{place['id']}-{len(shots) + 1:02d}",
            "look": text["look"],
            "image": f"photos/{place['id']}/{saved.name}",
            "source": item["page"],
            "credit": item["artist"],
            "license": item["license"],
            "angle": text["angle"],
            "light": text["light"],
            "how": text["how"],
        })
        time.sleep(0.15)

    for i, frame in enumerate(place["frames"]):
        for variant, item in enumerate(assigned[i]):
            add(materialize(frame, item, variant), item)
    for item in rest:
        add(extra_frame(place, item, len(shots)), item)
        if len(shots) >= 32:
            break

    # Authored frames that got no keyword hit still need a picture if any file remains unused.
    unused = [item for item in pool if item["title"] not in {s.get("_title") for s in []}]
    have_looks = {s["look"] for s in shots}
    for frame in place["frames"]:
        if frame["look"] in have_looks or not pool:
            continue
        # Pair with the next downloaded-but we may have used all images.
        # Skip if we already have 20. The extras cover the count.
        break

    print(f"  saved {len(shots)}")
    return {
        "id": place["id"],
        "name": place["name"],
        "day": place["day"],
        "match": place["match"],
        "shots": shots,
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    places = []
    for place_def in PLACES:
        built = build_place(place_def)
        if built["shots"]:
            places.append(built)
    payload = {
        "note": "Reference photos of the place. Open one for the angle, the light, and how to take it.",
        "places": places,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=1))
    total = sum(len(p["shots"]) for p in places)
    thin = [f"{p['name']} ({len(p['shots'])})" for p in places if len(p["shots"]) < 16]
    print(f"Wrote {OUT_JSON} · {len(places)} places · {total} frames")
    if thin:
        print("Under 16:", ", ".join(thin))


if __name__ == "__main__":
    main()
