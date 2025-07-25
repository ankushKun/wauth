/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
    console.log("PocketBase hooks initialized")
    e.next()
})


onRecordAuthWithOAuth2Request((e) => {
    e.next()
})

onRecordCreateRequest((e) => {
    const authId = e.auth.get("id")
    e.record.set("user", authId)
    e.next()
}, "connected_wallets")

onRecordCreateRequest((e) => {
    const utils = require(`${__hooks}/utils.js`)
    const authId = e.auth.get("id")

    // Get encrypted passwords from request headers
    let encryptedPassword = null
    let encryptedConfirmPassword = null

    if (e.requestEvent && e.requestEvent.request && e.requestEvent.request.header) {
        encryptedPassword = e.requestEvent.request.header.get("encrypted-password")
        encryptedConfirmPassword = e.requestEvent.request.header.get("encrypted-confirm-password")
    }

    e.record.set("user", authId)

    // if user already has a wallet, skip
    // else get new jwk and address and set in record
    if (!encryptedPassword || !encryptedConfirmPassword) {
        throw new Error("Missing encrypted password headers")
    }

    try {
        const res = $http.send({
            url: "http://localhost:8091/jwk",
            method: "GET",
            headers: {
                "encrypted-password": encryptedPassword,
                "encrypted-confirm-password": encryptedConfirmPassword
            }
        })

        if (res.statusCode !== 200) {
            throw new Error(`Backend returned status ${res.statusCode}: ${res.body}`)
        }

        const body = res.body
        const bodyJson = utils.bodyToJson(body)

        // Store the encrypted JWK and related data
        e.record.set("encrypted_jwk", bodyJson.encryptedJWK)
        e.record.set("salt", bodyJson.salt)
        e.record.set("public_key", bodyJson.publicKey)
        e.record.set("address", bodyJson.address)
    } catch (error) {
        console.error("Error creating wallet:", error)
        throw error
    }
    e.next()
}, "wallets")

onRecordAfterCreateSuccess((e) => {
    e.next()
}, "wallets")

onRecordEnrich((e) => {
    e.record.hide("encrypted_jwk")
    e.record.hide("salt")
    e.next()
}, "wallets")

