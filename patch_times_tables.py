import sys

def main():
    file_path = "/Users/damian/GitHub/Helena/math/src/games/TimesTables.svelte"
    with open(file_path, "r") as f:
        content = f.read()

    # Chunk 1
    target1 = """  interface Props {
    grade: number;
    onCorrect: (a: number, b: number) => void;
    onIncorrect: (details: { question: string; answer: number; userVal: number }) => void;
    onFinished: (score: number, total: number) => void;
    setAstridMessage?: (msg: string, pose?: 'thinking' | 'happy' | 'wow' | 'sad' | 'sleeping', duration?: number) => void;
  }

  let { grade, onCorrect, onIncorrect, onFinished, setAstridMessage }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let currentVal = $state<string>('');
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);

  interface Question {
    a: number;
    b: number;
    answer: number;
    isFocus: boolean;
  }
  let questions = $state<Question[]>([]);"""
    repl1 = """  interface Props {
    grade: number;
    onCorrect: (a: number, b: number, timeMs?: number) => void;
    onIncorrect: (details: { a?: number; b?: number; question: string; answer: number; userVal: number }) => void;
    onFinished: (score: number, total: number) => void;
    setAstridMessage?: (msg: string, pose?: 'thinking' | 'happy' | 'wow' | 'sad' | 'sleeping', duration?: number) => void;
  }

  let { grade, onCorrect, onIncorrect, onFinished, setAstridMessage }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let currentVal = $state<string>('');
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);
  
  let startTime = $state(0);
  let isFluent = $state(false);

  interface Question {
    a: number;
    b: number;
    answer: number;
    isFocus: boolean;
    isMissed?: boolean;
  }
  let questions = $state<Question[]>([]);"""

    # Chunk 2
    target2 = """  onMount(() => {
    determineFocusAndGenerate();
    focusInput();
  });"""
    repl2 = """  onMount(() => {
    determineFocusAndGenerate();
    focusInput();
    startTime = Date.now();
  });"""

    # Chunk 3
    target3 = """  function determineFocusAndGenerate() {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const facts = mathOverrides.times_tables_facts || {};
    
    // Find first unmastered table (2-12)
    let foundFocus = null;
    for (let f = 2; f <= 12; f++) {
      if ((facts[f] || 0) < 5) {
        foundFocus = f;
        break;
      }
    }
    
    focusTable = foundFocus;
    const initialMastery = focusTable ? (facts[focusTable] || 0) : 0;

    if (focusTable && setAstridMessage) {
      const needed = 5 - initialMastery;
      setAstridMessage(`Let's work on your ${focusTable}s! You need ${needed} more correct to master it.`, 'thinking', 5000);
    } else if (setAstridMessage) {
      setAstridMessage(`You've mastered everything! Time for a mixed review. 🌟`, 'wow', 4000);
    }

    const list: Question[] = [];
    const maxVal = grade <= 3 ? 10 : 12; 

    for (let i = 0; i < 10; i++) {
      let a, b, isFocus = false;
      // 70% chance to test the focus table if one exists
      if (focusTable && i < 7) {
        a = focusTable;
        b = 2 + Math.floor(Math.random() * (maxVal - 1));
        isFocus = true;
      } else {
        a = 2 + Math.floor(Math.random() * (maxVal - 1));
        b = 2 + Math.floor(Math.random() * (maxVal - 1));
      }
      
      // Randomize a and b order so it's not always e.g., 7 x N
      if (Math.random() > 0.5) {
        [a, b] = [b, a];
      }
      
      list.push({ a, b, answer: a * b, isFocus });
    }
    
    // Shuffle the list
    list.sort(() => Math.random() - 0.5);
    questions = list;
  }"""
    repl3 = """  function determineFocusAndGenerate() {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const facts = mathOverrides.times_tables_facts || {};
    const missedFacts = mathOverrides.missed_facts || {};
    
    // Find first unmastered table (2-12)
    let foundFocus = null;
    for (let f = 2; f <= 12; f++) {
      if ((facts[f] || 0) < 5) {
        foundFocus = f;
        break;
      }
    }
    
    focusTable = foundFocus;
    const initialMastery = focusTable ? (facts[focusTable] || 0) : 0;

    if (focusTable && setAstridMessage) {
      const needed = 5 - initialMastery;
      setAstridMessage(`Let's work on your ${focusTable}s! You need ${needed} more correct to master it.`, 'thinking', 5000);
    } else if (setAstridMessage) {
      setAstridMessage(`You've mastered everything! Time for a mixed review. 🌟`, 'wow', 4000);
    }

    const list: Question[] = [];
    const maxVal = grade <= 3 ? 10 : 12; 

    // Inject missed facts
    const validMissed = Object.keys(missedFacts).map(k => {
      const [aStr, bStr] = k.split('x');
      return { a: parseInt(aStr), b: parseInt(bStr) };
    }).filter(q => q.a <= maxVal && q.b <= maxVal);
    
    const missedToInject: {a: number, b: number}[] = [];
    if (validMissed.length > 0) {
      validMissed.sort(() => Math.random() - 0.5);
      const numToInject = Math.min(validMissed.length, Math.random() > 0.5 ? 2 : 1);
      for (let i = 0; i < numToInject; i++) {
        missedToInject.push(validMissed[i]);
      }
      if (setAstridMessage) {
        setTimeout(() => {
          setAstridMessage(`Hey, let's review the ones that gave you trouble last time!`, 'thinking', 4000);
        }, 5500);
      }
    }

    let injectIndex = 0;

    for (let i = 0; i < 10; i++) {
      let a, b, isFocus = false, isMissed = false;
      if (missedToInject.length > 0 && injectIndex < missedToInject.length && list.length >= 2 && Math.random() > 0.4) {
        a = missedToInject[injectIndex].a;
        b = missedToInject[injectIndex].b;
        isMissed = true;
        injectIndex++;
      } else if (focusTable && i < 7) {
        a = focusTable;
        b = 2 + Math.floor(Math.random() * (maxVal - 1));
        isFocus = true;
      } else {
        a = 2 + Math.floor(Math.random() * (maxVal - 1));
        b = 2 + Math.floor(Math.random() * (maxVal - 1));
      }
      
      // Randomize a and b order so it's not always e.g., 7 x N
      if (!isMissed && Math.random() > 0.5) {
        [a, b] = [b, a];
      }
      
      list.push({ a, b, answer: a * b, isFocus, isMissed });
    }
    
    // Ensure all injected are added
    while (injectIndex < missedToInject.length) {
      const q = missedToInject[injectIndex];
      list[list.length - 1 - injectIndex] = { a: q.a, b: q.b, answer: q.a * q.b, isFocus: false, isMissed: true };
      injectIndex++;
    }

    // Shuffle the list
    list.sort(() => Math.random() - 0.5);
    questions = list;
  }"""

    # Chunk 4
    target4 = """  function handleCheck() {
    if (disabled) return;
    const val = parseInt(currentVal, 10);
    const q = questions[questionIndex];
    if (!q) return;

    disabled = true;
    if (val === q.answer) {
      score++;
      feedback = '✓ Correct';
      feedbackClass = 'correct';
      
      // This immediately updates the store, triggering reactivity for currentFocusMastery
      onCorrect(q.a, q.b);
      
      if (q.isFocus && setAstridMessage && focusTable) {
        const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
        const newMastery = (mathOverrides.times_tables_facts?.[focusTable] || 0);
        
        if (newMastery === 5) {
          setAstridMessage(`Wow! You just mastered the ${focusTable}s table! The plant is blooming! 🌸`, 'wow', 5000);
        } else if (newMastery < 5) {
          const needed = 5 - newMastery;
          if (needed === 1) {
            setAstridMessage(`Almost there! Only 1 left to master your ${focusTable}s!`, 'happy', 3000);
          } else {
            setAstridMessage(`Nice! ${needed} more to master your ${focusTable}s.`, 'happy', 2500);
          }
        }
      } else if (!q.isFocus && setAstridMessage) {
        if (Math.random() > 0.6) setAstridMessage('Great review!', 'happy', 2000);
      }
      
    } else {
      feedback = `Not quite — the answer was ${q.answer}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: `${q.a} × ${q.b}`,
        answer: q.answer,
        userVal: val
      });
      if (setAstridMessage) {
        setAstridMessage(`That's okay, learning is growing!`, 'sad', 3000);
      }
    }

    setTimeout(() => {
      if (questionIndex + 1 < 10) {
        questionIndex++;
        currentVal = '';
        feedback = '';
        feedbackClass = '';
        disabled = false;
        focusInput();
      } else {
        if (setAstridMessage) setAstridMessage(`Round finished! You got ${score} out of 10.`, 'happy', 4000);
        onFinished(score, 10);
      }
    }, 1400);
  }"""
    repl4 = """  function handleCheck() {
    if (disabled) return;
    const val = parseInt(currentVal, 10);
    const q = questions[questionIndex];
    if (!q) return;

    disabled = true;
    if (val === q.answer) {
      score++;
      feedback = '✓ Correct';
      feedbackClass = 'correct';
      
      const elapsedMs = Date.now() - startTime;
      if (elapsedMs <= 3000) {
        isFluent = true;
      }
      
      // This immediately updates the store, triggering reactivity for currentFocusMastery
      onCorrect(q.a, q.b, elapsedMs);
      
      if (isFluent && setAstridMessage && Math.random() > 0.5) {
        setAstridMessage(`Whoa, under 3 seconds! ⚡`, 'wow', 3000);
      } else if (q.isFocus && setAstridMessage && focusTable) {
        const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
        const newMastery = (mathOverrides.times_tables_facts?.[focusTable] || 0);
        
        if (newMastery === 5) {
          setAstridMessage(`Wow! You just mastered the ${focusTable}s table! The plant is blooming! 🌸`, 'wow', 5000);
        } else if (newMastery < 5) {
          const needed = 5 - newMastery;
          if (needed === 1) {
            setAstridMessage(`Almost there! Only 1 left to master your ${focusTable}s!`, 'happy', 3000);
          } else {
            setAstridMessage(`Nice! ${needed} more to master your ${focusTable}s.`, 'happy', 2500);
          }
        }
      } else if (!q.isFocus && setAstridMessage) {
        if (Math.random() > 0.6) setAstridMessage('Great review!', 'happy', 2000);
      }
      
    } else {
      feedback = `Not quite — the answer was ${q.answer}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        a: q.a,
        b: q.b,
        question: `${q.a} × ${q.b}`,
        answer: q.answer,
        userVal: val
      });
      if (setAstridMessage) {
        setAstridMessage(`That's okay, learning is growing!`, 'sad', 3000);
      }
    }

    setTimeout(() => {
      isFluent = false;
      if (questionIndex + 1 < 10) {
        questionIndex++;
        currentVal = '';
        feedback = '';
        feedbackClass = '';
        disabled = false;
        focusInput();
        startTime = Date.now();
      } else {
        if (setAstridMessage) setAstridMessage(`Round finished! You got ${score} out of 10.`, 'happy', 4000);
        onFinished(score, 10);
      }
    }, 1400);
  }"""

    # Chunk 5
    target5 = """      <input
        type="number"
        bind:this={inputEl}
        bind:value={currentVal}
        {disabled}
        onkeydown={handleKeydown}
        class="answer-input"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Type here..."
        aria-label="Type your answer"
      />"""
    repl5 = """      <input
        type="number"
        bind:this={inputEl}
        bind:value={currentVal}
        {disabled}
        onkeydown={handleKeydown}
        class="answer-input {isFluent ? 'fluent-flash' : ''}"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Type here..."
        aria-label="Type your answer"
      />"""

    # Chunk 6
    target6 = """  .feedback-msg.wrong {
    color: var(--danger);
    background: rgba(255, 23, 68, 0.1);
  }
</style>"""
    repl6 = """  .feedback-msg.wrong {
    color: var(--danger);
    background: rgba(255, 23, 68, 0.1);
  }

  .fluent-flash {
    animation: fluentGlow 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes fluentGlow {
    0% { box-shadow: 0 0 0 rgba(0, 230, 118, 0); border-color: var(--success); }
    50% { box-shadow: 0 0 20px rgba(0, 230, 118, 0.8); border-color: var(--success); transform: scale(1.05); }
    100% { box-shadow: 0 0 10px rgba(0, 230, 118, 0.4); border-color: var(--success); transform: scale(1); }
  }
</style>"""

    if target1 not in content: print("Target 1 not found"); sys.exit(1)
    if target2 not in content: print("Target 2 not found"); sys.exit(1)
    if target3 not in content: print("Target 3 not found"); sys.exit(1)
    if target4 not in content: print("Target 4 not found"); sys.exit(1)
    if target5 not in content: print("Target 5 not found"); sys.exit(1)
    if target6 not in content: print("Target 6 not found"); sys.exit(1)

    content = content.replace(target1, repl1)
    content = content.replace(target2, repl2)
    content = content.replace(target3, repl3)
    content = content.replace(target4, repl4)
    content = content.replace(target5, repl5)
    content = content.replace(target6, repl6)

    with open(file_path, "w") as f:
        f.write(content)

    print("Success")

if __name__ == "__main__":
    main()
