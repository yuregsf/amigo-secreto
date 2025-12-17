import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import './App.css'

type Pair = {
  giver: string;
  receiver: string;
  password: string;
}

function App() {
  const inputsRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<string[]>(['']);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [password, setPassword] = useState('');
  const [decryptedReceiver, setDecryptedReceiver] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const encryptedReceiver = urlParams.get('receiver');

  const handleAdd = () => {
    setParticipants([...participants, '']);
  }

  const handleEdit = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    setParticipants(participants.map((participant, i) =>
      i === index ? e.target.value : participant
    ));
  }

  const handleInputShortcuts = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        (participants?.at(-1)?.length || 0) > 0 &&
          handleAdd();
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    const lastInput = inputsRef.current?.querySelector('input:last-of-type') as HTMLInputElement;
    if (lastInput) {
      lastInput.focus();
    }
  }, [participants.length]);

  const handleRemove = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  }

  /*
    Text padding (32 bytes) +
    Vigenere cipher +
    XOR with 0xC +
    Base64 encoding
    */
  const encrypt = (text: string, password: string) => {
    // 1. Pad text to length 32
    const paddingLength = 32 - text.length;
    const paddedText = text + `${paddingLength}`.repeat(paddingLength);

    // 2. Vigenere cipher with password (4 numbers)
    let ciphered = '';
    for (let i = 0; i < paddedText.length; i++) {
      const shift = parseInt(password[i % password.length]);
      ciphered += String.fromCharCode(paddedText.charCodeAt(i) + shift);
    }

    // 3. XOR with 0xC
    let xored = '';
    for (let i = 0; i < ciphered.length; i++) {
      xored += String.fromCharCode(ciphered.charCodeAt(i) ^ 0xC);
    }

    // 4. Base64 encode
    return btoa(xored);
  }

  const decrypt = (text: string, password: string) => {
    // 1. Base64 decode
    const decoded = atob(text);

    // 2. XOR with 0xC (reverse)
    let unxored = '';
    for (let i = 0; i < decoded.length; i++) {
      unxored += String.fromCharCode(decoded.charCodeAt(i) ^ 0xC);
    }

    // 3. Reverse Vigenere cipher
    let deciphered = '';
    for (let i = 0; i < unxored.length; i++) {
      const shift = parseInt(password[i % password.length]);
      deciphered += String.fromCharCode(unxored.charCodeAt(i) - shift);
    }

    // 4. Remove padding
    return deciphered.replaceAll(/[0-9]/g, '')
  }

  const createUrl = (receiver: string, password: string) => {
    const baseUrl = window.location.origin;
    const url = new URL(baseUrl);
    url.searchParams.append('receiver', encrypt(receiver, password));

    return url.toString();
  }

  const handeShuffle = () => {
    const shuffled = [...participants].filter(p => p !== '').sort(() => Math.random() - 0.5);
    const pairs =
      shuffled.map((participant, index) => {
        const nextIndex = (index + 1) % shuffled.length;
        const password = Math.random().toString(10).substring(2, 6)
        return { giver: participant, receiver: createUrl(shuffled[nextIndex], password), password };
      });

    setPairs(pairs);
  }

  const handleDecrypt = () => {
    if (encryptedReceiver && password.length === 4) {
      try {
        const decrypted = decrypt(encryptedReceiver, password);
        setDecryptedReceiver(decrypted);
      } catch (error) {
        alert('Senha incorreta ou dados inválidos');
      }
    }
  }

  const handleCopyToClipboard = (link: string, password: string) => {
    const text = `Para revelar seu amigo secreto, entre no link e utilize a senha *${password}*:\n\nLINK: ${link}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Copiado para a área de transferência!');
    });
  }

  if (encryptedReceiver) {
    return (
      <div className='flex flex-col gap-4 items-center justify-center min-h-screen'>
        <h1>Amigo Secreto do Cabaré</h1>
        {!decryptedReceiver ? (
          <div className='flex flex-col gap-4'>
            <p>Digite a senha de 4 dígitos:</p>
            <input
              type="text"
              className='border rounded p-2 text-center'
              placeholder="Senha (4 dígitos)"
              maxLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
            />
            <button
              type="button"
              className='bg-blue-500 text-white font-bold p-2 rounded'
              onClick={handleDecrypt}
            >
              Revelar
            </button>
          </div>
        ) : (
          <div className='text-center'>
            <p>Seu amigo secreto é:</p>
            <h1 className='text-4xl font-bold mt-4'>{decryptedReceiver}</h1>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <h1>Amigo Secreto do Cabaré</h1>
      <p className='p-5'>Insira o nome dos participantes abaixo:</p>

      <form className='flex flex-col gap-4 justify-center'>
        {participants.map((value, index) => (
          <div ref={inputsRef} className='flex gap-2 w-full' key={index}>
            <input
              type="text"
              className='w-full border rounded p-2'
              placeholder="Nome do participante"
              onChange={(e) => handleEdit(e, index)}
              onKeyDown={handleInputShortcuts}
              value={value}
            />
            <button type="button" onClick={() => handleRemove(index)}>🗑️</button>
          </div>
        ))}
      </form>
      <button type="button" className='w-full' onClick={handleAdd}>+</button>
      <button type="button" className='w-full bg-green-500 font-bold' onClick={handeShuffle}>Sortear 🎉</button>
      <div>{
        Object.entries(pairs).length > 0 && (
          <div className='mt-4 flex justify-center flex-col'>
            <h2>Resultados:</h2>
            <ul>
              {pairs.map(({ giver, receiver, password }) => (
                <li key={giver} className='items-center mb-2'>
                  <span>{giver}:</span>
                  <button type="button" onClick={() => handleCopyToClipboard(receiver, password)}> 📋 </button>
                </li>
              ))}
            </ul>
          </div>
        )
      }</div>
    </div>
  )
}

export default App
