import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Mnemonic, HDNodeWallet, SigningKey } from 'ethers'
import { keccak256 } from 'js-sha3'
import crypto from 'crypto'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(buffer: Buffer): string {
  let x = BigInt('0x' + buffer.toString('hex'))
  const base = BigInt(58)
  let result = ''
  while (x > BigInt(0)) {
    const rem = x % base
    x = x / base
    result = ALPHABET[Number(rem)] + result
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result = '1' + result;
  }
  return result
}

function base58CheckEncode(payload: Buffer): string {
  const hash1 = crypto.createHash('sha256').update(payload).digest()
  const hash2 = crypto.createHash('sha256').update(hash1).digest()
  const checksum = hash2.slice(0, 4)
  const combined = Buffer.concat([payload, checksum])
  return base58Encode(combined)
}

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function POST(req: NextRequest) {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return existing addresses if already generated
    if (user.usdcBscAddress && user.usdcTronAddress) {
      return NextResponse.json({
        bscAddress: user.usdcBscAddress,
        tronAddress: user.usdcTronAddress
      })
    }

    // Retrieve or generate master mnemonic from Settings
    let mnemonicSetting = await db.setting.findUnique({ where: { key: 'usdc_master_mnemonic' } })
    let mnemonicPhrase = ''

    if (!mnemonicSetting) {
      // Create a random BIP39-compatible 12-word mnemonic phrase (standard fallback)
      const randomEntropy = crypto.randomBytes(16)
      const entropyMnemonic = Mnemonic.entropyToPhrase(randomEntropy)
      
      mnemonicSetting = await db.setting.create({
        data: {
          key: 'usdc_master_mnemonic',
          value: entropyMnemonic
        }
      })
      mnemonicPhrase = entropyMnemonic
    } else {
      mnemonicPhrase = mnemonicSetting.value
    }

    // Resolve user's derivation index: auto-assign next index if 0
    let derivationIndex = user.usdcDerivationIndex
    if (derivationIndex === 0) {
      // Find the highest derivation index used so far
      const lastUser = await db.user.findFirst({
        where: { usdcDerivationIndex: { gt: 0 } },
        orderBy: { usdcDerivationIndex: 'desc' }
      })
      derivationIndex = (lastUser?.usdcDerivationIndex || 0) + 1
    }

    const mnemonicObj = Mnemonic.fromPhrase(mnemonicPhrase)
    const root = HDNodeWallet.fromMnemonic(mnemonicObj, "m")

    // 1. Derive BSC BEP20 Address (m/44'/60'/0'/0/index)
    const bscNode = root.derivePath(`m/44'/60'/0'/0/${derivationIndex}`)
    const bscAddress = bscNode.address

    // 2. Derive Tron TRC20 Address (m/44'/195'/0'/0/index)
    const tronNode = root.derivePath(`m/44'/195'/0'/0/${derivationIndex}`)
    
    // Retrieve uncompressed public key coordinates (Secp256k1)
    const signingKey = new SigningKey(tronNode.privateKey)
    const uncompressedPubKey = signingKey.publicKey
    const rawPubKeyHex = uncompressedPubKey.slice(4) // Remove "0x04" prefix
    
    const hash = keccak256(Buffer.from(rawPubKeyHex, 'hex'))
    const addressHex = hash.slice(-40) // Last 20 bytes
    
    const tronPayload = Buffer.concat([
      Buffer.from([0x41]), // Tron Address byte prefix (0x41)
      Buffer.from(addressHex, 'hex')
    ])
    const tronAddress = base58CheckEncode(tronPayload)

    // Save derived addresses back to the User model
    await db.user.update({
      where: { id: userId },
      data: {
        usdcBscAddress: bscAddress,
        usdcTronAddress: tronAddress,
        usdcDerivationIndex: derivationIndex
      }
    })

    return NextResponse.json({
      bscAddress,
      tronAddress
    })
  } catch (error) {
    console.error('USDC Address Generation error:', error)
    return NextResponse.json({ error: 'Failed to generate crypto address' }, { status: 500 })
  }
}
