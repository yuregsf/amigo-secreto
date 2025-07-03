import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import './App.css'

function App() {
  const inputsRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<string[]>(['']);
  const [pairs, setPairs] = useState<Record<string, string>>({});

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

  const handeShuffle = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs: Record<string, string> = {};

    shuffled.forEach((participant, index) => {
      const nextIndex = (index + 1) % shuffled.length;
      pairs[participant] = shuffled[nextIndex];
    });

    setPairs(pairs);
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
          <div className='mt-4'>
            <h2>Resultados:</h2>
            <ul>
              {Object.entries(pairs).map(([giver, receiver]) => (
                <li key={giver}>{giver} -&gt; {receiver}</li>
              ))}
            </ul>
          </div>
        )
      }</div>
    </div>
  )
}

export default App
