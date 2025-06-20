"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL = void 0;
exports.IDL = {
    "version": "0.1.0",
    "name": "degenie_token_creator",
    "instructions": [
        {
            "name": "createToken",
            "accounts": [
                {
                    "name": "mint",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "metadata",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mintAuthority",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "metadataProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "name",
                    "type": "string"
                },
                {
                    "name": "symbol",
                    "type": "string"
                },
                {
                    "name": "uri",
                    "type": "string"
                },
                {
                    "name": "decimals",
                    "type": "u8"
                },
                {
                    "name": "initialSupply",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "initializeBondingCurve",
            "accounts": [
                {
                    "name": "bondingCurve",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "authority",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "treasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "initialPrice",
                    "type": "u64"
                },
                {
                    "name": "priceIncrement",
                    "type": "u64"
                },
                {
                    "name": "maxSupply",
                    "type": "u64"
                },
                {
                    "name": "curveType",
                    "type": {
                        "defined": "CurveType"
                    }
                },
                {
                    "name": "growthRate",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "buyTokens",
            "accounts": [
                {
                    "name": "bondingCurve",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "buyer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "buyerTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userTracker",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "creator",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "platformTreasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "solAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "sellTokens",
            "accounts": [
                {
                    "name": "bondingCurve",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "seller",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "sellerTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "creator",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "platformTreasury",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "tokenAmount",
                    "type": "u64"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "bondingCurve",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "mint",
                        "type": "publicKey"
                    },
                    {
                        "name": "currentPrice",
                        "type": "u64"
                    },
                    {
                        "name": "priceIncrement",
                        "type": "u64"
                    },
                    {
                        "name": "totalSupply",
                        "type": "u64"
                    },
                    {
                        "name": "maxSupply",
                        "type": "u64"
                    },
                    {
                        "name": "authority",
                        "type": "publicKey"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    },
                    {
                        "name": "initialPrice",
                        "type": "u64"
                    },
                    {
                        "name": "curveType",
                        "type": {
                            "defined": "CurveType"
                        }
                    },
                    {
                        "name": "growthRate",
                        "type": "u64"
                    },
                    {
                        "name": "treasuryBalance",
                        "type": "u64"
                    },
                    {
                        "name": "totalVolume",
                        "type": "u64"
                    },
                    {
                        "name": "graduationThreshold",
                        "type": "u64"
                    },
                    {
                        "name": "isGraduated",
                        "type": "bool"
                    },
                    {
                        "name": "creationFee",
                        "type": "u64"
                    },
                    {
                        "name": "transactionFeeBps",
                        "type": "u16"
                    },
                    {
                        "name": "creatorFeeBps",
                        "type": "u16"
                    },
                    {
                        "name": "platformFeeBps",
                        "type": "u16"
                    },
                    {
                        "name": "creationTimestamp",
                        "type": "i64"
                    },
                    {
                        "name": "launchProtectionPeriod",
                        "type": "i64"
                    },
                    {
                        "name": "maxBuyDuringProtection",
                        "type": "u64"
                    },
                    {
                        "name": "transactionCooldown",
                        "type": "u64"
                    },
                    {
                        "name": "maxPriceImpactBps",
                        "type": "u16"
                    }
                ]
            }
        },
        {
            "name": "treasury",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "publicKey"
                    },
                    {
                        "name": "totalCollected",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "userTracker",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "wallet",
                        "type": "publicKey"
                    },
                    {
                        "name": "mint",
                        "type": "publicKey"
                    },
                    {
                        "name": "lastTransactionTime",
                        "type": "i64"
                    },
                    {
                        "name": "totalBoughtSol",
                        "type": "u64"
                    },
                    {
                        "name": "transactionCount",
                        "type": "u32"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "types": [
        {
            "name": "CurveType",
            "type": {
                "kind": "enum",
                "variants": [
                    {
                        "name": "Linear"
                    },
                    {
                        "name": "Exponential"
                    },
                    {
                        "name": "Logarithmic"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "InvalidTokenName",
            "msg": "Invalid token name"
        },
        {
            "code": 6001,
            "name": "InvalidTokenSymbol",
            "msg": "Invalid token symbol"
        },
        {
            "code": 6002,
            "name": "InvalidMetadataUri",
            "msg": "Invalid metadata URI"
        },
        {
            "code": 6003,
            "name": "InsufficientAuthority",
            "msg": "Insufficient authority"
        },
        {
            "code": 6004,
            "name": "InvalidAmount",
            "msg": "Invalid amount - must be greater than 0"
        },
        {
            "code": 6005,
            "name": "AccountFrozen",
            "msg": "Account is frozen"
        },
        {
            "code": 6006,
            "name": "InsufficientBalance",
            "msg": "Insufficient balance"
        },
        {
            "code": 6007,
            "name": "TokenNameTooLong",
            "msg": "Token name too long"
        },
        {
            "code": 6008,
            "name": "TokenSymbolTooLong",
            "msg": "Token symbol too long"
        },
        {
            "code": 6009,
            "name": "ExceedsMaxSupply",
            "msg": "Exceeds maximum supply"
        },
        {
            "code": 6010,
            "name": "AlreadyGraduated",
            "msg": "Token has already graduated to DEX"
        },
        {
            "code": 6011,
            "name": "GraduationThresholdNotMet",
            "msg": "Graduation threshold not met"
        },
        {
            "code": 6012,
            "name": "NotGraduated",
            "msg": "Token has not graduated yet"
        },
        {
            "code": 6013,
            "name": "PoolAlreadyCreated",
            "msg": "Liquidity pool already created"
        },
        {
            "code": 6014,
            "name": "TransactionCooldown",
            "msg": "Transaction cooldown period not elapsed"
        },
        {
            "code": 6015,
            "name": "ExceedsProtectionLimit",
            "msg": "Purchase exceeds protection period limit"
        },
        {
            "code": 6016,
            "name": "ExceedsPriceImpactLimit",
            "msg": "Price impact exceeds maximum allowed"
        }
    ]
};
//# sourceMappingURL=degenie_token_creator.js.map