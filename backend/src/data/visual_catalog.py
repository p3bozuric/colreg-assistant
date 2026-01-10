"""Visual catalog for inline streaming.

Defines all available visuals that the LLM can reference via markers.
Catalog IDs match frontend component configs for direct rendering.
"""

from typing import Literal

VisualType = Literal["day-shapes", "sound-signal", "morse-signal", "vessel-lights"]

VISUAL_CATALOG: dict[str, dict] = {
    # ===========================================
    # VESSEL LIGHTS - Navigation lights for various vessel types
    # ===========================================
    "vessel-lights:power-driven": {
        "type": "vessel-lights",
        "data": {"config": "power-driven"},
        "caption": "Power-driven vessel",
        "use-when": "When user wants to see lights for a power-driven vessel.",
        "rule": "Rule 23",
        "ignore_in_prompt": False
    },
    "vessel-lights:sailing": {
        "type": "vessel-lights",
        "data": {"config": "sailing"},
        "caption": "Sailing vessel",
        "use-when": "When user wants to see lights for a sailing vessel.",
        "rule": "Rule 25",
        "ignore_in_prompt": False
    },
        "vessel-lights:air-cushon": {
        "type": "air-cushon",
        "data": {"config": "air-cushon"},
        "caption": "Air cushon vessel",
        "use-when": "When user wants to see lights for a air cushon vessel.",
        "rule": "Rule 23",
        "ignore_in_prompt": False
        },
    "vessel-lights:fishing-trawling": {
        "type": "vessel-lights",
        "data": {"config": "fishing-trawling"},
        "caption": "Fishing vessel trawling",
        "use-when": "When user wants to see lights for a fishing vessel trawling.",
        "rule": "Rule 26",
        "ignore_in_prompt": False
    },
    "vessel-lights:fishing-other": {
        "type": "vessel-lights",
        "data": {"config": "fishing-other"},
        "caption": "Fishing vessel (not trawling)",
        "use-when": "When user wants to see lights for a fishing vessel that is not trawling.",
        "rule": "Rule 26",
        "ignore_in_prompt": False
    },
    "vessel-lights:vessel-towing": {
        "type": "vessel-lights",
        "data": {"config": "vessel-towing"},
        "caption": "Towing",
        "use-when": "When user wants to see lights for a vessel that's towing another vessel or being towed by another vessel.",
        "rule": "Rule 24",
        "ignore_in_prompt": False
    },
    "vessel-lights:vessel-pushing": {
        "type": "vessel-lights",
        "data": {"config": "vessel-pushing"},
        "caption": "Pushing",
        "use-when": "When user wants to see lights for a vessel that's pushing another vessel or being pushed by another vessel.",
        "rule": "Rule 24",
        "ignore_in_prompt": False
    },
    "vessel-lights:not-under-command": {
        "type": "vessel-lights",
        "data": {"config": "not-under-command"},
        "caption": "Vessel not under command",
        "use-when": "When user wants to see lights for a vessel not under command.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "vessel-lights:restricted-ability-to-maneuver": {
        "type": "vessel-lights",
        "data": {"config": "restricted-ability-to-maneuver"},
        "caption": "Vessel restricted in ability to maneuver",
        "use-when": "When user wants to see lights for a vessel restricted in ability to maneuver.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "vessel-lights:restricted-ability-to-maneuver-underwater-operations": {
        "type": "vessel-lights",
        "data": {"config": "restricted-ability-to-maneuver-underwater-operations"},
        "caption": "Vessel restricted in ability to maneuver - underwater operations",
        "use-when": "When user wants to see lights for a vessel restricted in ability to maneuver because of underwater operations. (not for diving operations)",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "vessel-lights:restricted-ability-to-maneuver-mine-clearance": {
        "type": "vessel-lights",
        "data": {"config": "restricted-ability-to-maneuver-mine-clearance"},
        "caption": "Vessel restricted in ability to maneuver - mine clearance",
        "use-when": "When user wants to see lights for a vessel restricted in ability to maneuver because of mine clearance.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "vessel-lights:anchored": {
        "type": "vessel-lights",
        "data": {"config": "anchored"},
        "caption": "Vessel at anchor",
        "use-when": "When user wants to see lights for a vessel at anchor.",
        "rule": "Rule 30",
        "ignore_in_prompt": False
    },
    "vessel-lights:aground": {
        "type": "vessel-lights",
        "data": {"config": "aground"},
        "caption": "Vessel aground",
        "use-when": "When user wants to see lights for a vessel aground.",
        "rule": "Rule 30",
        "ignore_in_prompt": False
    },
    "vessel-lights:pilot-on-duty": {
        "type": "vessel-lights",
        "data": {"config": "pilot-on-duty"},
        "caption": "Pilot vessel on duty",
        "use-when": "When user wants to see lights for a pilot vessel on duty.",
        "rule": "Rule 29",
        "ignore_in_prompt": False
    },
    "vessel-lights:constrained-by-draft": {
        "type": "vessel-lights",
        "data": {"config": "constrained-by-draft"},
        "caption": "Vessel constrained by draft",
        "use-when": "When user wants to see lights for a vessel constrained by draft.",
        "rule": "Rule 28",
        "ignore_in_prompt": False
    },
    "vessel-lights:seaplane": {
        "type": "vessel-lights",
        "data": {"config": "seaplane"},
        "caption": "Seaplane",
        "use-when": "When user wants to see lights for a seaplane.",
        "rule": "Rule 31",
        "ignore_in_prompt": False
    },

    # ===========================================
    # DAY SHAPES - Daytime signals
    # ===========================================
    "day-shapes:anchored": {
        "type": "day-shapes",
        "data": {"config": "anchored"},
        "caption": "Vessel at anchor - placed where best seen in the fore part of the vessel.",
        "use-when": "When user wants to see day shapes for a vessel at anchor. It should be placed where best seen in fore part of the vessel.",
        "rule": "Rule 30",
        "ignore_in_prompt": False
    },
    "day-shapes:not-under-command": {
        "type": "day-shapes",
        "data": {"config": "not-under-command"},
        "caption": "Vessel is not under command - shapes in a vertical line where they can best be seen",
        "use-when": "When user wants to see day shapes for a vessel not under command. Shapes should be in a vertical line where they can best be seen.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "day-shapes:restricted-ability-to-maneuver": {
        "type": "day-shapes",
        "data": {"config": "restricted-ability-to-maneuver"},
        "caption": "Restricted in ability to maneuver",
        "use-when": "When user wants to see day shapes for a vessel restricted in ability to maneuver. ",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "day-shapes:underwater-operations": {
        "type": "day-shapes",
        "data": {"config": "ram-underwater-ops"},
        "caption": "Vessel restricted in ability to maneuver because of underwater operations - placed in a vertical line where they can best be seen. Supplementary shapes required for indication of obstructions and free passage.",
        "use-when": "When user wants to see day shapes for a vessel restricted in ability to maneuver because of underwater operations.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "day-shapes:underwater-operations-may-pass": {
        "type": "day-shapes",
        "data": {"config": "ram-underwater-ops-vessel-may-pass"},
        "caption": "Shapes that indicate the side on which another vessel may pass in case of underwater operations.",
        "use-when": "When user wants to see day shapes that vessel restricted in ability to maneuver because of underwater operations uses to mark side of the ship on which other vessels may pass her.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "day-shapes:underwater-operations-obstruction": {
        "type": "day-shapes",
        "data": {"config": "ram-underwater-ops-obstruction"},
        "caption": "Shapes that indicate the side on which obstructions exist in case of underwater operations.",
        "use-when": "When user wants to see day shapes that vessel restricted in ability to maneuver because of underwater operations uses to mark side of the ship on which there is some kind of obstruction.",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "day-shapes:mine-clearance": {
        "type": "day-shapes",
        "data": {"config": "mine-clearance"},
        "caption": "Vessel engaged in mine clearance. Three balls: One at foremast head and one at each end of the fore yard. Dangerous to approach within 1000m.",
        "use-when": "When user wants to see day shapes for a vessel engaged in mine clearance. Keep in mind - these are not in vertical but in a cross pattern. One ball is at foremast head, and other two at each end of the fore yard. ",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },
    "day-shapes:constrained-by-draught": {
        "type": "day-shapes",
        "data": {"config": "cbd"},
        "caption": "Constrained by draught - exhibiting the shape where it can best be seen.",
        "use-when": "When user wants to see day shapes for vessel constrained by draught.",
        "rule": "Rule 28",
        "ignore_in_prompt": False
    },
    "day-shapes:aground": {
        "type": "day-shapes",
        "data": {"config": "aground"},
        "caption": "Aground vessel should exhibit the shapes in a vertical line where they can best be seen.",
        "use-when": "When user wants to see day shapes for vessel that's aground.",
        "rule": "Rule 30",
        "ignore_in_prompt": False
    },
    "day-shapes:sailing-motor": {
        "type": "day-shapes",
        "data": {"config": "sailing-motor"},
        "caption": "Sailing vessel under power (motor-sailing).",
        "use-when": "User wants to see day shapes for sailing vessel under power.",
        "rule": "Rule 25",
        "ignore_in_prompt": False

    },
    "day-shapes:fishing": {
        "type": "day-shapes",
        "data": {"config": "fishing"},
        "caption": "Vessel engaged in trawling or other fishing other then trawling (but gear does not extend more than 150m horizontally from the vessel)",
        "use-when": "User wants to see usual shapes fishing vessel needs to show during the day",
        "rule": "Rule 26",
        "ignore_in_prompt": False
    },
    "day-shapes:fishing-gear": {
        "type": "day-shapes",
        "data": {"config": "fishing-gear"},
        "caption": "Vessel engaged in fishing - when gear extends more than 150m horizontally from the vessel. This shape should be exhibited on the side on which the gear is extended.",
        "use-when": "User wants to see day shape fishing vessel needs to exhibit on side where is his fishing gear when gear extends more then 150m",
        "rule": "Rule 26",
        "ignore_in_prompt": False
    },
    "day-shapes:towing-over-200m": {
        "type": "day-shapes",
        "data": {"config": "towing-over-200m"},
        "caption": "Vessel towing & vessel being towed both exhibit the shape (tow length over 200m)",
        "use-when": "When user wants to see day shape that's used in towing when tow length is over 200m horizontally.",
        "rule": "Rule 24",
        "ignore_in_prompt": False
    },
    "day-shapes:towing-submerged-under-200m": {
        "type": "day-shapes",
        "data": {"config": "towing-submerged-under-200m"},
        "caption": "Only partially submerged vessel being towed needs to exhibit the shape (tow length under 200m)",
        "use-when": "When user wants to see day shape that's used in towing when partially submerged tows length is under 200m horizontally.",
        "rule": "Rule 24",
        "ignore_in_prompt": False
    },
    "day-shapes:towing-submerged-over-200m": {
        "type": "day-shapes",
        "data": {"config": "towing-submerged-over-200m"},
        "caption": "Vessel towing & vessel being towed both exhibit the shape (tow length over 200m)",
        "use-when": "When user wants to see day shape that's used in towing when partially submerged tows length is over 200m horizontally.",
        "rule": "Rule 24",
        "ignore_in_prompt": False
    },
    "day-shapes:diving-operations": {
        "type": "day-shapes",
        "data": {"config": "diving-operations"},
        "caption": "Vessel engaged in diving operations (too small for standard shapes). Rigid replica of International Code flag 'A' (at least 1m height).",
        "use-when": "User wants to see 'shape' or 'flag' for diving operations",
        "rule": "Rule 27",
        "ignore_in_prompt": False
    },


# THIS IS WHERE YOU LEFT OFF

    # ===========================================
    # SOUND SIGNALS - Fog and maneuvering signals
    # ===========================================
    "sound-signal:power-driven-making-way": {
        "type": "sound-signal",
        "data": {"config": "power-driven-making-way"},
        "caption": "Power-driven vessel making way through water must sound one prolonged blast at intervals of not more than 2 minutes",
        "use-when": "User asks to see or hear how would power driven vessel making way in low visibility conditions signal sound like.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "sound-signal:power-driven-underway-not-making-way": {
        "type": "sound-signal",
        "data": {"config": "power-driven-underway-not-making-way"},
        "caption": "Power-driven vessel underway but stopped and making no way through the water must sound at intervals of not more than 2 minutes two prolonged blasts in succession with an interval of about 2 seconds between them.",
        "use-when": "User asks to see or hear how would power driven vessel not making way in low visibility conditions signal sound like.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "sound-signal:nuc-ram-cbd-sailing-fishing": {
        "type": "sound-signal",
        "data": {"config": "nuc-ram-cbd-sailing-fishing"},
        "caption": "Vessels not under command, with restricted maneuverability, constrained by draft, sailing vessel, fishing vessel, or vessel towing/pushing must sound at intervals of not more than 2 minutes three blasts in succession, namely one prolonged followed by two short blasts.",
        "use-when": "User asks to see or hear how would vessels not under command, with restricted maneuverability, constrained by draft, sailing vessel, fishing vessel, or vessel towing/pushing signal sound like in low visibility conditions.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
     "sound-signal:fishing-ram-anchor": {
        "type": "sound-signal",
        "data": {"config": "fishing-anchor"},
        "caption": "Vessels with restricted maneuverability and fishing vessels at anchor shall sound one prolonged followed by two short blasts.",
        "use-when": "User asks to see or hear how would vessels with restricted maneuverability and fishing vessels at anchor signal sound like in low visibility conditions.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },   
    "sound-signal:vessel-towed": {
        "type": "sound-signal",
        "data": {"config": "vessel-towed"},
        "caption": "Vessel being towed if manned must at intervals of not more than 2 minutes sound four blasts in succession, namely one prolonged followed by three short blasts. When practicable, this signal shall be made immediately after the signal made by the towing vessel.",
        "use-when": "User asks to see or hear how would vessels being towed if manned signal sound like in low visibility conditions.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "sound-signal:pilot-vessel": {
        "type": "sound-signal",
        "data": {"config": "pilot-vessel"},
        "caption": "Besides usual signals for making way, not making way and anchor, pilot vessel on duty (identity signal)",
        "use-when": "User asks to see or hear how would pilot signal sound like in low visibility conditions besides usual signals for making way, not making way and anchor.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "sound-signal:anchored": {
        "type": "sound-signal",
        "data": {"config": "anchored"},
        "caption": "Vessel at anchor in intervals of not more then 1 minute do rapid ringing of bell for 5 seconds (if longer then 100m this will be followed by 5 seconds of gong), followed by one short blast, prolonged blast, and one short blast.",
        "use-when": "User asks to see or hear how would vessel at anchor signal sound like in low visibility conditions besides usual signals for making way, not making way and anchor.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "sound-signal:aground": {
        "type": "sound-signal",
        "data": {"config": "aground"},
        "caption": "Vessel aground must give bell signal, if required - gong as well. In addition - give 3 separate and distinct strokes on the bell before and after the rapid ringing of the bell.",
        "use-when": "User asks to see or hear how would aground vessel signal sound like in low visibility conditions besides usual signals for making way, not making way and anchor.",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "sound-signal:altering-to-starboard": {
        "type": "sound-signal",
        "data": {"config": "altering-to-starboard"},
        "caption": "Altering course to starboard",
        "use-when": "User asks to see or hear how would a vessel signal sound when altering course to starboard.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:altering-to-port": {
        "type": "sound-signal",
        "data": {"config": "altering-to-port"},
        "caption": "Altering course to port",
        "use-when": "User asks to see or hear how would a vessel signal sound when altering course to port.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:operating-astern": {
        "type": "sound-signal",
        "data": {"config": "operating-astern"},
        "caption": "Operating astern propulsion",
        "use-when": "User asks to see or hear how would a vessel signal sound when operating astern (going backwards).",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:danger-doubt": {
        "type": "sound-signal",
        "data": {"config": "danger-doubt"},
        "caption": "Danger/doubt signal",
        "use-when": "User asks to see or hear the danger or doubt signal when a vessel doesn't understand another's intentions or doubts sufficient action is being taken to avoid collision.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:overtaking-starboard": {
        "type": "sound-signal",
        "data": {"config": "overtaking-starboard"},
        "caption": "Intending to overtake on starboard side",
        "use-when": "User asks to see or hear how would a vessel signal sound when they want to overtake on starboard side.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:overtaking-port": {
        "type": "sound-signal",
        "data": {"config": "overtaking-port"},
        "caption": "Intending to overtake on port side",
        "use-when": "User asks to see or hear how would a vessel signal sound when they want to overtake on port side.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:overtaking-agreement": {
        "type": "sound-signal",
        "data": {"config": "overtaking-agreement"},
        "caption": "Agreement to be overtaken",
        "use-when": "User asks to see or hear how would a vessel signal sound when they agree with being overtaken.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },
    "sound-signal:approaching-bend": {
        "type": "sound-signal",
        "data": {"config": "approaching-bend"},
        "caption": "Approaching a bend or obstruction",
        "use-when": "User asks to see or hear how would a vessel signal sound when approaching a bend or area where other vessels may be obscured.",
        "rule": "Rule 34",
        "ignore_in_prompt": False
    },


    # ===========================================
    # MORSE SIGNALS - Single-letter signals
    # ===========================================
    "morse-signal:a": {
        "type": "morse-signal",
        "data": {"letter": "A", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:b": {
        "type": "morse-signal",
        "data": {"letter": "B", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:c": {
        "type": "morse-signal",
        "data": {"letter": "C", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:d": {
        "type": "morse-signal",
        "data": {"letter": "D", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:e": {
        "type": "morse-signal",
        "data": {"letter": "E", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:f": {
        "type": "morse-signal",
        "data": {"letter": "F", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:g": {
        "type": "morse-signal",
        "data": {"letter": "G", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:h": {
        "type": "morse-signal",
        "data": {"letter": "H", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:i": {
        "type": "morse-signal",
        "data": {"letter": "I", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:j": {
        "type": "morse-signal",
        "data": {"letter": "J", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:k": {
        "type": "morse-signal",
        "data": {"letter": "K", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:l": {
        "type": "morse-signal",
        "data": {"letter": "L", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:m": {
        "type": "morse-signal",
        "data": {"letter": "M", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:n": {
        "type": "morse-signal",
        "data": {"letter": "N", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:o": {
        "type": "morse-signal",
        "data": {"letter": "O", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:p": {
        "type": "morse-signal",
        "data": {"letter": "P", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:q": {
        "type": "morse-signal",
        "data": {"letter": "Q", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:r": {
        "type": "morse-signal",
        "data": {"letter": "R", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:s": {
        "type": "morse-signal",
        "data": {"letter": "S", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:t": {
        "type": "morse-signal",
        "data": {"letter": "T", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:u": {
        "type": "morse-signal",
        "data": {"letter": "U", "showMeaning": True},
        "caption": "",
        "use-when": "When user asks about attracting attention with light or sound signals",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
    "morse-signal:v": {
        "type": "morse-signal",
        "data": {"letter": "V", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:w": {
        "type": "morse-signal",
        "data": {"letter": "W", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:x": {
        "type": "morse-signal",
        "data": {"letter": "X", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:y": {
        "type": "morse-signal",
        "data": {"letter": "Y", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:z": {
        "type": "morse-signal",
        "data": {"letter": "Z", "showMeaning": True},
        "caption": "",
        "use-when": "",
        "rule": "",
        "ignore_in_prompt": True
    },
    "morse-signal:sos": {
        "type": "morse-signal",
        "data": {"letter": "SOS", "showMeaning": True},
        "caption": "",
        "use-when": "When user asks about distress signals or emergency morse signals",
        "rule": "Rule 35",
        "ignore_in_prompt": False
    },
}


def get_visual_by_id(visual_id: str) -> dict | None:
    """Retrieve visual config by catalog ID.

    Args:
        visual_id: The catalog ID (e.g., "vessel-lights:power-driven-underway")

    Returns:
        Visual config dict or None if not found
    """
    return VISUAL_CATALOG.get(visual_id.lower())


def get_available_visual_ids() -> list[str]:
    """Return list of all available visual IDs."""
    return list(VISUAL_CATALOG.keys())


def generate_catalog_reference(rules: list[str]) -> str:
    """Generate a compact catalog reference for the system prompt.

    Groups visuals by type with their IDs and captions for LLM context.
    """
    lines = []
    current_type = None

    #TODO: potentially implement filtering using rules to avoid confusion

    for visual_id, config in VISUAL_CATALOG.items():
        if config["ignore_in_prompt"]:
            continue

        vtype = config["type"]

        if vtype != current_type:
            current_type = vtype
            type_display = vtype.replace("-", " ").title()
            lines.append(f"\n**{type_display}:**")

        use_when = config.get("use-when", "")
        lines.append(f"- `{visual_id}` - {use_when}")

    return "\n".join(lines)
