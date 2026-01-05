"""Visual catalog for inline streaming.

Defines all available visuals that the LLM can reference via markers.
Catalog IDs match frontend component configs for direct rendering.
"""

from typing import Literal

VisualType = Literal["light-arcs", "day-shapes", "sound-signal", "morse-signal", "vessel-lights"]

VISUAL_CATALOG: dict[str, dict] = {
    # ===========================================
    # LIGHT ARCS - Navigation lights (top view)
    # ===========================================
    "light-arcs:power-driven-underway": {
        "type": "light-arcs",
        "data": {"config": "power-driven-underway"},
        "caption": "Power-driven vessel underway - navigation lights"
    },
    "light-arcs:power-driven-over-50m": {
        "type": "light-arcs",
        "data": {"config": "power-driven-over-50m"},
        "caption": "Power-driven vessel over 50m - two masthead lights"
    },
    "light-arcs:sailing-underway": {
        "type": "light-arcs",
        "data": {"config": "sailing-underway"},
        "caption": "Sailing vessel underway - navigation lights"
    },
    "light-arcs:vessel-towing": {
        "type": "light-arcs",
        "data": {"config": "vessel-towing"},
        "caption": "Vessel engaged in towing - yellow towing light"
    },
    "light-arcs:not-under-command": {
        "type": "light-arcs",
        "data": {"config": "not-under-command"},
        "caption": "Vessel not under command - two red all-round lights"
    },
    "light-arcs:restricted-ability-to-maneuver": {
        "type": "light-arcs",
        "data": {"config": "restricted-ability-to-maneuver"},
        "caption": "Vessel restricted in ability to maneuver - red-white-red"
    },
    "light-arcs:anchored": {
        "type": "light-arcs",
        "data": {"config": "anchored"},
        "caption": "Vessel at anchor - white all-round light"
    },
    "light-arcs:aground": {
        "type": "light-arcs",
        "data": {"config": "aground"},
        "caption": "Vessel aground - two red + anchor light"
    },
    "light-arcs:fishing-trawling": {
        "type": "light-arcs",
        "data": {"config": "fishing-trawling"},
        "caption": "Vessel engaged in trawling - green over white"
    },
    "light-arcs:fishing-other": {
        "type": "light-arcs",
        "data": {"config": "fishing-other"},
        "caption": "Fishing vessel (not trawling) - red over white"
    },
    "light-arcs:pilot-on-duty": {
        "type": "light-arcs",
        "data": {"config": "pilot-on-duty"},
        "caption": "Pilot vessel on duty - white over red"
    },
    "light-arcs:constrained-by-draft": {
        "type": "light-arcs",
        "data": {"config": "constrained-by-draft"},
        "caption": "Vessel constrained by draft - three red lights"
    },

    # ===========================================
    # DAY SHAPES - Daytime signals
    # ===========================================
    "day-shapes:anchored": {
        "type": "day-shapes",
        "data": {"config": "anchored"},
        "caption": "Vessel at anchor - one ball (Rule 30)"
    },
    "day-shapes:nuc": {
        "type": "day-shapes",
        "data": {"config": "nuc"},
        "caption": "Not under command - two balls (Rule 27)"
    },
    "day-shapes:ram": {
        "type": "day-shapes",
        "data": {"config": "ram"},
        "caption": "Restricted in ability to maneuver - ball-diamond-ball (Rule 27)"
    },
    "day-shapes:cbd": {
        "type": "day-shapes",
        "data": {"config": "cbd"},
        "caption": "Constrained by draught - cylinder (Rule 28)"
    },
    "day-shapes:aground": {
        "type": "day-shapes",
        "data": {"config": "aground"},
        "caption": "Vessel aground - three balls (Rule 30)"
    },
    "day-shapes:sailing-motor": {
        "type": "day-shapes",
        "data": {"config": "sailing-motor"},
        "caption": "Sailing vessel under power - cone apex down (Rule 25)"
    },
    "day-shapes:fishing-trawling": {
        "type": "day-shapes",
        "data": {"config": "fishing-trawling"},
        "caption": "Vessel engaged in trawling - two cones (Rule 26)"
    },
    "day-shapes:fishing-other": {
        "type": "day-shapes",
        "data": {"config": "fishing-other"},
        "caption": "Fishing vessel (not trawling) - two cones (Rule 26)"
    },
    "day-shapes:towing-over-200m": {
        "type": "day-shapes",
        "data": {"config": "towing-over-200m"},
        "caption": "Towing vessel (tow over 200m) - diamond (Rule 24)"
    },
    "day-shapes:mine-clearance": {
        "type": "day-shapes",
        "data": {"config": "mine-clearance"},
        "caption": "Mine clearance vessel - three balls (Rule 27)"
    },
    "day-shapes:diving-operations": {
        "type": "day-shapes",
        "data": {"config": "diving-operations"},
        "caption": "Diving operations - ball-diamond-ball (Rule 27)"
    },

    # ===========================================
    # SOUND SIGNALS - Fog and maneuvering signals
    # ===========================================
    "sound-signal:power-driven-making-way": {
        "type": "sound-signal",
        "data": {"config": "power-driven-making-way"},
        "caption": "Power-driven vessel making way - one prolonged blast"
    },
    "sound-signal:power-driven-stopped": {
        "type": "sound-signal",
        "data": {"config": "power-driven-underway-not-making-way"},
        "caption": "Power-driven vessel stopped - two prolonged blasts"
    },
    "sound-signal:nuc-ram-cbd-sailing-fishing": {
        "type": "sound-signal",
        "data": {"config": "nuc-ram-cbd-sailing-fishing"},
        "caption": "NUC/RAM/CBD/Sailing/Fishing - one prolonged, two short"
    },
    "sound-signal:vessel-towed": {
        "type": "sound-signal",
        "data": {"config": "vessel-towed"},
        "caption": "Vessel being towed - one prolonged, three short"
    },
    "sound-signal:pilot-vessel": {
        "type": "sound-signal",
        "data": {"config": "pilot-vessel"},
        "caption": "Pilot vessel identity signal"
    },
    "sound-signal:altering-to-starboard": {
        "type": "sound-signal",
        "data": {"config": "altering-to-starboard"},
        "caption": "Altering course to starboard - one short blast"
    },
    "sound-signal:altering-to-port": {
        "type": "sound-signal",
        "data": {"config": "altering-to-port"},
        "caption": "Altering course to port - two short blasts"
    },
    "sound-signal:operating-astern": {
        "type": "sound-signal",
        "data": {"config": "operating-astern"},
        "caption": "Operating astern propulsion - three short blasts"
    },
    "sound-signal:danger-doubt": {
        "type": "sound-signal",
        "data": {"config": "danger-doubt"},
        "caption": "Danger/doubt signal - five or more short blasts"
    },
    "sound-signal:overtaking-starboard": {
        "type": "sound-signal",
        "data": {"config": "overtaking-starboard"},
        "caption": "Intending to overtake on starboard side"
    },
    "sound-signal:overtaking-port": {
        "type": "sound-signal",
        "data": {"config": "overtaking-port"},
        "caption": "Intending to overtake on port side"
    },
    "sound-signal:overtaking-agreement": {
        "type": "sound-signal",
        "data": {"config": "overtaking-agreement"},
        "caption": "Agreement to be overtaken"
    },

    # ===========================================
    # MORSE SIGNALS - Single-letter signals
    # ===========================================
    "morse-signal:A": {
        "type": "morse-signal",
        "data": {"letter": "A", "showMeaning": True},
        "caption": "Signal A (.-) - Diver down, keep clear at slow speed"
    },
    "morse-signal:B": {
        "type": "morse-signal",
        "data": {"letter": "B", "showMeaning": True},
        "caption": "Signal B (-...) - Dangerous goods aboard"
    },
    "morse-signal:D": {
        "type": "morse-signal",
        "data": {"letter": "D", "showMeaning": True},
        "caption": "Signal D (-..) - Keep clear, maneuvering with difficulty"
    },
    "morse-signal:G": {
        "type": "morse-signal",
        "data": {"letter": "G", "showMeaning": True},
        "caption": "Signal G (--.) - I require a pilot"
    },
    "morse-signal:H": {
        "type": "morse-signal",
        "data": {"letter": "H", "showMeaning": True},
        "caption": "Signal H (....) - Pilot on board"
    },
    "morse-signal:J": {
        "type": "morse-signal",
        "data": {"letter": "J", "showMeaning": True},
        "caption": "Signal J (.---) - On fire with dangerous cargo, keep clear"
    },
    "morse-signal:K": {
        "type": "morse-signal",
        "data": {"letter": "K", "showMeaning": True},
        "caption": "Signal K (-.-) - I wish to communicate with you"
    },
    "morse-signal:L": {
        "type": "morse-signal",
        "data": {"letter": "L", "showMeaning": True},
        "caption": "Signal L (.-..) - Stop your vessel instantly"
    },
    "morse-signal:O": {
        "type": "morse-signal",
        "data": {"letter": "O", "showMeaning": True},
        "caption": "Signal O (---) - Man overboard"
    },
    "morse-signal:U": {
        "type": "morse-signal",
        "data": {"letter": "U", "showMeaning": True},
        "caption": "Signal U (..-) - You are running into danger"
    },
    "morse-signal:V": {
        "type": "morse-signal",
        "data": {"letter": "V", "showMeaning": True},
        "caption": "Signal V (...-) - I require assistance"
    },
    "morse-signal:W": {
        "type": "morse-signal",
        "data": {"letter": "W", "showMeaning": True},
        "caption": "Signal W (.--) - I require medical assistance"
    },
}


def get_visual_by_id(visual_id: str) -> dict | None:
    """Retrieve visual config by catalog ID.

    Args:
        visual_id: The catalog ID (e.g., "light-arcs:power-driven-underway")

    Returns:
        Visual config dict or None if not found
    """
    return VISUAL_CATALOG.get(visual_id.lower())


def get_available_visual_ids() -> list[str]:
    """Return list of all available visual IDs."""
    return list(VISUAL_CATALOG.keys())


def generate_catalog_reference() -> str:
    """Generate a compact catalog reference for the system prompt.

    Groups visuals by type with their IDs and captions for LLM context.
    """
    lines = []
    current_type = None

    for visual_id, config in VISUAL_CATALOG.items():
        vtype = config["type"]
        if vtype != current_type:
            current_type = vtype
            type_display = vtype.replace("-", " ").title()
            lines.append(f"\n**{type_display}:**")

        caption = config.get("caption", "")
        lines.append(f"- `{visual_id}` - {caption}")

    return "\n".join(lines)
