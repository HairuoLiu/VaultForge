// Paths are taken verbatim from the supplied STL archive.
// Rules: Instructions Manual pages 3, 6, 9, 12, 17; Sustainers Assembly pages 1–7.
// Bottom hinge and L/XL top hinge STLs each contain a pair; S/M top hinges are single parts.
// Rod STL files each contain two rods; the pin STL contains one complete lock pin set.
(function (root) {
  'use strict';
  const inventory = {
  "modules": {
    "S": {
      "3": {
        "1F": {
          "standard": "02. SUSTAINERS/01. S Families/S3/Modules/S3 1F Module.stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/01. S Families/S3/Modules/S3 2F Module.stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/01. S Families/S3/Modules/S3 4F Module.stl"
        }
      },
      "4": {
        "1F": {
          "standard": "02. SUSTAINERS/01. S Families/S4/Modules/S4 1F Module.stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/01. S Families/S4/Modules/S4 2F Module.stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/01. S Families/S4/Modules/S4 4F Module.stl"
        }
      },
      "5": {
        "1F": {
          "standard": "02. SUSTAINERS/01. S Families/S5/Modules/S5 1F Module.stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/01. S Families/S5/Modules/S5 2F Module.stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/01. S Families/S5/Modules/S5 4F Module.stl"
        }
      },
      "6": {
        "1F": {
          "standard": "02. SUSTAINERS/01. S Families/S6/Modules/S6 1F Module.stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/01. S Families/S6/Modules/S6 2F Module.stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/01. S Families/S6/Modules/S6 4F Module.stl"
        }
      },
      "7": {
        "1F": {
          "standard": "02. SUSTAINERS/01. S Families/S7/Modules/S7 1F Module.stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/01. S Families/S7/Modules/S7 2F Module.stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/01. S Families/S7/Modules/S7 4F Module.stl"
        }
      }
    },
    "M": {
      "3": {
        "1F": {
          "standard": "02. SUSTAINERS/02. M Families/M3/Modules/M3 1F Module .stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/02. M Families/M3/Modules/M3 2F Module .stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/02. M Families/M3/Modules/M3 4F Module .stl"
        }
      },
      "4": {
        "1F": {
          "standard": "02. SUSTAINERS/02. M Families/M4/Modules/M4 1F Module .stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/02. M Families/M4/Modules/M4 2F Module .stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/02. M Families/M4/Modules/M4 4F Module .stl"
        }
      },
      "5": {
        "1F": {
          "standard": "02. SUSTAINERS/02. M Families/M5/Modules/M5 1F Module .stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/02. M Families/M5/Modules/M5 2F Module .stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/02. M Families/M5/Modules/M5 4F Module .stl"
        }
      },
      "6": {
        "1F": {
          "standard": "02. SUSTAINERS/02. M Families/M6/Modules/M6 1F Module .stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/02. M Families/M6/Modules/M6 2F Module .stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/02. M Families/M6/Modules/M6 4F Module .stl"
        }
      },
      "7": {
        "1F": {
          "standard": "02. SUSTAINERS/02. M Families/M7/Modules/M7 1F Module .stl"
        },
        "2F": {
          "standard": "02. SUSTAINERS/02. M Families/M7/Modules/M7 2F Module .stl"
        },
        "4F": {
          "standard": "02. SUSTAINERS/02. M Families/M7/Modules/M7 4F Module .stl"
        }
      }
    },
    "L": {
      "3": {
        "1F": {
          "dividers": "02. SUSTAINERS/03. L Families/L3/Modules/L3 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L3/Modules/L3 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L3/Modules/L3 1F Sealed Module.stl"
        },
        "2F": {
          "dividers": "02. SUSTAINERS/03. L Families/L3/Modules/L3 2F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L3/Modules/L3 2F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L3/Modules/L3 2F Sealed Module.stl"
        },
        "4F": {
          "dividers": "02. SUSTAINERS/03. L Families/L3/Modules/L3 4F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L3/Modules/L3 4F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L3/Modules/L3 4F Sealed Module.stl"
        }
      },
      "4": {
        "1F": {
          "dividers": "02. SUSTAINERS/03. L Families/L4/Modules/L4 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L4/Modules/L4 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L4/Modules/L4 1F Sealed Module.stl"
        },
        "2F": {
          "dividers": "02. SUSTAINERS/03. L Families/L4/Modules/L4 2F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L4/Modules/L4 2F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L4/Modules/L4 2F Sealed Module.stl"
        },
        "4F": {
          "dividers": "02. SUSTAINERS/03. L Families/L4/Modules/L4 4F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L4/Modules/L4 4F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L4/Modules/L4 4F Sealed Module.stl"
        }
      },
      "5": {
        "1F": {
          "dividers": "02. SUSTAINERS/03. L Families/L5/Modules/L5 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L5/Modules/L5 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L5/Modules/L5 1F Sealed Module.stl"
        },
        "2F": {
          "dividers": "02. SUSTAINERS/03. L Families/L5/Modules/L5 2F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L5/Modules/L5 2F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L5/Modules/L5 2F Sealed Module.stl"
        },
        "4F": {
          "dividers": "02. SUSTAINERS/03. L Families/L5/Modules/L5 4F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L5/Modules/L5 4F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L5/Modules/L5 4F Sealed Module.stl"
        }
      },
      "6": {
        "1F": {
          "dividers": "02. SUSTAINERS/03. L Families/L6/Modules/L6 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L6/Modules/L6 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L6/Modules/L6 1F Sealed Module.stl"
        },
        "2F": {
          "dividers": "02. SUSTAINERS/03. L Families/L6/Modules/L6 2F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L6/Modules/L6 2F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L6/Modules/L6 2F Sealed Module.stl"
        },
        "4F": {
          "dividers": "02. SUSTAINERS/03. L Families/L6/Modules/L6 4F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L6/Modules/L6 4F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L6/Modules/L6 4F Sealed Module.stl"
        }
      },
      "7": {
        "1F": {
          "dividers": "02. SUSTAINERS/03. L Families/L7/Modules/L7 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L7/Modules/L7 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L7/Modules/L7 1F Sealed Module.stl"
        },
        "2F": {
          "dividers": "02. SUSTAINERS/03. L Families/L7/Modules/L7 2F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L7/Modules/L7 2F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L7/Modules/L7 2F Sealed Module.stl"
        },
        "4F": {
          "dividers": "02. SUSTAINERS/03. L Families/L7/Modules/L7 4F Dividers Module.stl",
          "flat": "02. SUSTAINERS/03. L Families/L7/Modules/L7 4F Flat Module.stl",
          "sealed": "02. SUSTAINERS/03. L Families/L7/Modules/L7 4F Sealed Module.stl"
        }
      }
    },
    "XL": {
      "3": {
        "1F": {
          "dividers": "02. SUSTAINERS/04. XL Families/XL3/Modules/XL3 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/04. XL Families/XL3/Modules/XL3 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/04. XL Families/XL3/Modules/XL3 1F Sealed Module.stl"
        }
      },
      "4": {
        "1F": {
          "dividers": "02. SUSTAINERS/04. XL Families/XL4/Modules/XL4 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/04. XL Families/XL4/Modules/XL4 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/04. XL Families/XL4/Modules/XL4 1F Sealed Module.stl"
        }
      },
      "5": {
        "1F": {
          "dividers": "02. SUSTAINERS/04. XL Families/XL5/Modules/XL5 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/04. XL Families/XL5/Modules/XL5 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/04. XL Families/XL5/Modules/XL5 1F Sealed Module.stl"
        }
      },
      "6": {
        "1F": {
          "dividers": "02. SUSTAINERS/04. XL Families/XL6/Modules/XL6 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/04. XL Families/XL6/Modules/XL6 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/04. XL Families/XL6/Modules/XL6 1F Sealed Module.stl"
        }
      },
      "7": {
        "1F": {
          "dividers": "02. SUSTAINERS/04. XL Families/XL7/Modules/XL7 1F Dividers Module.stl",
          "flat": "02. SUSTAINERS/04. XL Families/XL7/Modules/XL7 1F Flat Module.stl",
          "sealed": "02. SUSTAINERS/04. XL Families/XL7/Modules/XL7 1F Sealed Module.stl"
        }
      }
    }
  },
  "roofs": {
    "S3": {
      "whole": [
        "02. SUSTAINERS/01. S Families/S3/Roofs/S3 Roof.stl"
      ],
      "split": []
    },
    "S4": {
      "whole": [
        "02. SUSTAINERS/01. S Families/S4/Roof/S4 Roof.stl"
      ],
      "split": []
    },
    "S5": {
      "whole": [
        "02. SUSTAINERS/01. S Families/S5/Roofs/S5 Roof.stl"
      ],
      "split": []
    },
    "S6": {
      "whole": [
        "02. SUSTAINERS/01. S Families/S6/Roofs/S6 Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/01. S Families/S6/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/01. S Families/S6/Roofs/S6 Roof Part 1.stl",
        "02. SUSTAINERS/01. S Families/S6/Roofs/S6 Roof Part 2.stl"
      ]
    },
    "S7": {
      "whole": [
        "02. SUSTAINERS/01. S Families/S7/Roof/S7 Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/01. S Families/S7/Roof/Connector For Split Roof.stl",
        "02. SUSTAINERS/01. S Families/S7/Roof/S7 Roof Part 1.stl",
        "02. SUSTAINERS/01. S Families/S7/Roof/S7 Roof Part 2.stl"
      ]
    },
    "M3": {
      "whole": [
        "02. SUSTAINERS/02. M Families/M3/Roofs/M3 Roof.stl"
      ],
      "split": []
    },
    "M4": {
      "whole": [
        "02. SUSTAINERS/02. M Families/M4/Roof/M4 Roof.stl"
      ],
      "split": []
    },
    "M5": {
      "whole": [
        "02. SUSTAINERS/02. M Families/M5/Roofs/M5 Roof.stl"
      ],
      "split": []
    },
    "M6": {
      "whole": [
        "02. SUSTAINERS/02. M Families/M6/Roofs/M6 Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/02. M Families/M6/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/02. M Families/M6/Roofs/M6 Roof Part 1.stl",
        "02. SUSTAINERS/02. M Families/M6/Roofs/M6 Roof Part 2.stl"
      ]
    },
    "M7": {
      "whole": [
        "02. SUSTAINERS/02. M Families/M7/Roofs/M7 Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/02. M Families/M7/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/02. M Families/M7/Roofs/M7 Roof Part 1.stl",
        "02. SUSTAINERS/02. M Families/M7/Roofs/M7 Roof Part 2.stl"
      ]
    },
    "L3": {
      "whole": [
        "02. SUSTAINERS/03. L Families/L3/Roofs/L3 Roof.stl"
      ],
      "split": []
    },
    "L4": {
      "whole": [
        "02. SUSTAINERS/03. L Families/L4/Roof/L4 Roof.stl"
      ],
      "split": []
    },
    "L5": {
      "whole": [
        "02. SUSTAINERS/03. L Families/L5/Roofs/L5 Roof.stl"
      ],
      "split": []
    },
    "L6": {
      "whole": [
        "02. SUSTAINERS/03. L Families/L6/Roofs/L6 Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/03. L Families/L6/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/03. L Families/L6/Roofs/L6 Roof Part 1.stl",
        "02. SUSTAINERS/03. L Families/L6/Roofs/L6 Roof Part 2.stl"
      ]
    },
    "L7": {
      "whole": [
        "02. SUSTAINERS/03. L Families/L7/Roofs/L7 Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/03. L Families/L7/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/03. L Families/L7/Roofs/L7 Roof Part 1.stl",
        "02. SUSTAINERS/03. L Families/L7/Roofs/L7 Roof Part 2.stl"
      ]
    },
    "XL3": {
      "whole": [
        "02. SUSTAINERS/04. XL Families/XL3/Roofs/XL3  Roof.stl"
      ],
      "split": []
    },
    "XL4": {
      "whole": [
        "02. SUSTAINERS/04. XL Families/XL4/Roofs/XL4  Roof.stl"
      ],
      "split": []
    },
    "XL5": {
      "whole": [
        "02. SUSTAINERS/04. XL Families/XL5/Roofs/XL5  Roof.stl"
      ],
      "split": []
    },
    "XL6": {
      "whole": [
        "02. SUSTAINERS/04. XL Families/XL6/Roofs/XL6  Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/04. XL Families/XL6/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/04. XL Families/XL6/Roofs/XL6 Roof Part 1.stl",
        "02. SUSTAINERS/04. XL Families/XL6/Roofs/XL6 Roof Part 2.stl"
      ]
    },
    "XL7": {
      "whole": [
        "02. SUSTAINERS/04. XL Families/XL7/Roofs/XL7  Roof Whole.stl"
      ],
      "split": [
        "02. SUSTAINERS/04. XL Families/XL7/Roofs/Connector For Split Roof.stl",
        "02. SUSTAINERS/04. XL Families/XL7/Roofs/XL7 Roof Part 1.stl",
        "02. SUSTAINERS/04. XL Families/XL7/Roofs/XL7 Roof Part 2.stl"
      ]
    }
  },
  "facades": {
    "S1F": "02. SUSTAINERS/01. S Families/Facades/S1F Facade.stl",
    "S2F": "02. SUSTAINERS/01. S Families/Facades/S2F Facade.stl",
    "S4F": "02. SUSTAINERS/01. S Families/Facades/S4F Facade.stl",
    "M1F": "02. SUSTAINERS/02. M Families/Facades/M1F Facade.stl",
    "M2F": "02. SUSTAINERS/02. M Families/Facades/M2F Facade.stl",
    "M4F": "02. SUSTAINERS/02. M Families/Facades/M4f Facade.stl",
    "L1F": "02. SUSTAINERS/03. L Families/Facades/L1F Facade.stl",
    "L2F": "02. SUSTAINERS/03. L Families/Facades/L2F Facade.stl",
    "L4F": "02. SUSTAINERS/03. L Families/Facades/L4F' Facade.stl",
    "XL1F": "02. SUSTAINERS/04. XL Families/XL1F Facade.stl"
  },
  "baseplates": {
    "S3": [
      "02. SUSTAINERS/05. Universal/Baseplates/01. S/S3 Baseplate.stl"
    ],
    "S4": [
      "02. SUSTAINERS/05. Universal/Baseplates/01. S/S4 Baseplate.stl"
    ],
    "S5": [
      "02. SUSTAINERS/05. Universal/Baseplates/01. S/S5 Baseplate.stl"
    ],
    "S6": [
      "02. SUSTAINERS/05. Universal/Baseplates/01. S/S6 Baseplate.stl"
    ],
    "S7": [
      "02. SUSTAINERS/05. Universal/Baseplates/01. S/S7 Baseplate.stl"
    ],
    "M3": [
      "02. SUSTAINERS/05. Universal/Baseplates/02. M/M3 Baseplate.stl"
    ],
    "M4": [
      "02. SUSTAINERS/05. Universal/Baseplates/02. M/M4 Baseplate.stl"
    ],
    "M5": [
      "02. SUSTAINERS/05. Universal/Baseplates/02. M/M5 Baseplate.stl"
    ],
    "M6": [
      "02. SUSTAINERS/05. Universal/Baseplates/02. M/M6 Baseplate.stl"
    ],
    "M7": [
      "02. SUSTAINERS/05. Universal/Baseplates/02. M/M7 Baseplate.stl"
    ],
    "L3": [
      "02. SUSTAINERS/05. Universal/Baseplates/03. L/L3 Baseplate.stl"
    ],
    "L4": [
      "02. SUSTAINERS/05. Universal/Baseplates/03. L/L4 Baseplate.stl"
    ],
    "L5": [
      "02. SUSTAINERS/05. Universal/Baseplates/03. L/L5 Baseplate.stl"
    ],
    "L6": [
      "02. SUSTAINERS/05. Universal/Baseplates/03. L/L6 Baseplate.stl"
    ],
    "L7": [
      "02. SUSTAINERS/05. Universal/Baseplates/03. L/L7 Baseplate.stl"
    ],
    "XL3": [
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL3  Gridfinity Baseplate.stl"
    ],
    "XL4": [
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL4  Gridfinity Baseplate.stl"
    ],
    "XL5": [
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL5  Gridfinity Baseplate.stl"
    ],
    "XL6": [
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL6 Part 1  Gridfinity Baseplate.stl",
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL6 Part 2  Gridfinity Baseplate.stl"
    ],
    "XL7": [
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL7 Part 1  Gridfinity Baseplate.stl",
      "02. SUSTAINERS/05. Universal/Baseplates/04. XL/XL7 Part 2  Gridfinity Baseplate.stl"
    ]
  },
  "dividers": {
    "L3-1F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L3-1F Depth Divider.stl",
    "L3-2F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L3-2F Depth Divider.stl",
    "L3-4F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L3-4F Depth Divider.stl",
    "L4-1F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L4-1F Depth Divider.stl",
    "L4-2F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L4-2F Depth Divider.stl",
    "L4-4F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L4-4F Depth Divider.stl",
    "L5-1F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L5-1F Depth Divider.stl",
    "L5-2F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L5-2F Depth Divider.stl",
    "L5-4F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L5-4F Depth Divider.stl",
    "L6-1F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L6-1F Depth Divider.stl",
    "L6-2F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L6-2F Depth Divider.stl",
    "L6-4F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L6-4F Depth Divider.stl",
    "L7-1F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L7-1F Depth Divider.stl",
    "L7-2F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L7-2F Depth Divider.stl",
    "L7-4F Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Depth Dividers/L7-4F Depth Divider.stl",
    "L-1F Seal Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Seal Dividers/L-1F Seal Divider.stl",
    "L-2F Seal Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Seal Dividers/L-2F Seal Divider.stl",
    "L-4F Seal Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Seal Dividers/L-4F Seal Divider.stl",
    "L-1F Width Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Width Dividers/L-1F Width Divider.stl",
    "L-2F Width Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Width Dividers/L-2F Width Divider.stl",
    "L-4F Width Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/L Width Dividers/L-4F Width Divider.stl",
    "M1F Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/M Dividers/M1F Divider.stl",
    "M2F Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/M Dividers/M2F Divider.stl",
    "M4F Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/M Dividers/M4F Divider.stl",
    "S1F Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/S Dividers/S1F Divider.stl",
    "S2F Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/S Dividers/S2F Divider.stl",
    "S4F Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/S Dividers/S4F Divider.stl",
    "XL3 Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/XL Depth Dividers/XL3 Depth Divider.stl",
    "XL4 Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/XL Depth Dividers/XL4 Depth Divider.stl",
    "XL5 Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/XL Depth Dividers/XL5 Depth Divider.stl",
    "XL6 Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/XL Depth Dividers/XL6 Depth Divider.stl",
    "XL7 Depth Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/XL Depth Dividers/XL7 Depth Divider.stl",
    "XL Seal Divider (Center).stl": "02. SUSTAINERS/05. Universal/Dividers/XL Seal Divider (Center).stl",
    "XL Seal Divider (Sides).stl": "02. SUSTAINERS/05. Universal/Dividers/XL Seal Divider (Sides).stl",
    "XL Width Divider.stl": "02. SUSTAINERS/05. Universal/Dividers/XL Width Divider.stl"
  }
};
  const universal = '02. SUSTAINERS/05. Universal/';
  const item = (path, qty, role, unit = 'piece') => ({ path, qty, role, unit });

  function options(width, depth, height) {
    const family = inventory.modules[width];
    if (!family) throw new Error('Unknown sustainer width: ' + width);
    const depths = Object.keys(family).sort();
    const d = depths.includes(String(depth)) ? String(depth) : depths[0];
    const heights = Object.keys(family[d]).sort();
    const h = heights.includes(height) ? height : heights[0];
    const variants = family[d][h];
    const interiors = variants.standard ? ['empty', 'gridfinity', 'dividers'] : ['empty', 'gridfinity', 'dividers', 'sealed'];
    return { depths, heights, interiors, roofs: inventory.roofs[width + d].split.length ? ['whole', 'split'] : ['whole'], depth: d, height: h };
  }

  function resolve(selection) {
    const { width: w, height: h, interior, roof } = selection;
    const d = String(selection.depth);
    const allowed = options(w, d, h);
    if (!allowed.depths.includes(d) || !allowed.heights.includes(h) || !allowed.interiors.includes(interior) || !allowed.roofs.includes(roof)) {
      throw new Error('Unsupported sustainer configuration');
    }
    const wd = w + d;
    const wide = w === 'L' || w === 'XL';
    const variants = inventory.modules[w][d][h];
    const variant = variants.standard ? 'standard' : ({ empty: 'flat', gridfinity: 'flat', dividers: 'dividers', sealed: 'sealed' })[interior];
    const structure = [item(variants[variant], 1, 'module'), item(inventory.facades[w + h], 1, 'facade')];
    [...inventory.roofs[wd][roof]].sort((a, b) => Number(a.includes('Connector')) - Number(b.includes('Connector'))).forEach(path => structure.push(item(path, 1, path.includes('Connector') ? 'roofConnector' : 'roof')));
    const bottomHinge = wide ? (h === '1F' ? 'L-XL 1F Hinge' : 'L 2-4F Hinge') : (h === '1F' ? 'S-M 1F Hinge' : 'S-M 2-4F Hinge');
    const topHinge = wide ? 'L-XL Hinge Top' : w + ' Hinge Top';
    const mechanism = [
      item(universal + 'Hinges/' + topHinge + '.stl', 1, 'topHinge', wide ? 'pair' : 'piece'),
      item(universal + 'Hinges/' + bottomHinge + '.stl', 1, 'bottomHinge', 'pair'),
      item(universal + 'Rods/' + (wide ? 'L-XL' : 'S-M') + ' Rods.stl', 1, 'rods', 'pair'),
      item(universal + 'Locks/LOCK HOLDER.stl', 2, 'lockHolder'),
      item(universal + 'Locks/LOCK INNER PART.stl', 2, 'lockInner'),
      item(universal + 'Locks/LOCK OUTER PART ' + (h === '1F' ? '1F' : '2-4F') + '.stl', 2, 'lockOuter'),
      item(universal + 'Locks/1 SET OF PINS FOR 1 LOCK.stl', 2, 'lockPins', 'set'),
      item(universal + 'Label for Sustainers.stl', 1, 'label')
    ];
    const interiorParts = [];
    const divider = (name, role) => interiorParts.push(item(inventory.dividers[name], null, role));
    if (interior === 'gridfinity') inventory.baseplates[wd].forEach(path => interiorParts.push(item(path, 1, 'baseplate')));
    if (interior === 'dividers') {
      if (!wide) divider(w + h + ' Divider.stl', 'divider');
      else if (w === 'L') {
        divider(wd + '-' + h + ' Depth Divider.stl', 'depthDivider');
        divider('L-' + h + ' Width Divider.stl', 'widthDivider');
      } else {
        divider(wd + ' Depth Divider.stl', 'depthDivider');
        divider('XL Width Divider.stl', 'widthDivider');
      }
    }
    if (interior === 'sealed') {
      if (w === 'L') divider('L-' + h + ' Seal Divider.stl', 'sealDivider');
      else {
        divider('XL Seal Divider (Sides).stl', 'sideSealDivider');
        divider('XL Seal Divider (Center).stl', 'centerSealDivider');
      }
    }
    const allItems = [...structure, ...mechanism, ...interiorParts];
    if (allItems.some(part => !part.path)) throw new Error('Incomplete sustainer catalog entry');
    return { structure, mechanism, interiorParts, hardware: [{ size: 'M4 × 10 mm', qty: 8 }, { size: 'M4 × 14 mm', qty: 16 }, { size: 'M4 × 20 mm', qty: 7 }] };
  }
  root.SustainerCatalog = { options, resolve };
})(globalThis);
