import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

const HomePage = () => {
  const [cards, setCards] = useState<any[]>(() => {
    // Load từ localStorage khi component mount
    if (typeof window !== 'undefined') {
      const savedCards = localStorage.getItem('flashcards');
      return savedCards ? JSON.parse(savedCards) : [];
    }
    return [];
  });
  const [currentCard, setCurrentCard] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lưu cards vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (typeof window !== 'undefined' && cards.length > 0) {
      localStorage.setItem('flashcards', JSON.stringify(cards));
    }
  }, [cards]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevCard();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextCard();
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          toggleMeaning();
          break;
        case 'Escape':
          event.preventDefault();
          setShowMeaning(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, cards.length]);

  const handleFileUpload = (file: File) => {
    if (!file) return;

    // Kiểm tra file type
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel' ||
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls');
    
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');

    if (!isExcel && !isCSV) {
      alert('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)');
      return;
    }

    if (isExcel) {
      // Xử lý file Excel
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Bỏ qua header row
          const rows = jsonData.slice(1) as any[][];
          
          const newCards = rows.map((row, index) => ({
            id: index,
            kanji: row[0]?.toString().trim() || '',
            phonetic: row[1]?.toString().trim() || '',
            meaning: row[2]?.toString().trim() || '',
            example: row[3]?.toString().trim() || ''
          })).filter(card => card.kanji && card.meaning);

          console.log('Loaded Excel cards:', newCards);
          setCards(newCards);
          setCurrentCard(0);
          setShowMeaning(false);
        } catch (error) {
          console.error('Error reading Excel file:', error);
          alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra format file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Xử lý file CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        const newCards = lines.slice(1).map((line, index) => {
          const values = line.split(',');
          return {
            id: index,
            kanji: values[0]?.trim() || '',
            phonetic: values[1]?.trim() || '',
            meaning: values[2]?.trim() || '',
            example: values[3]?.trim() || ''
          };
        }).filter(card => card.kanji && card.meaning);

        console.log('Loaded CSV cards:', newCards);
        setCards(newCards);
        setCurrentCard(0);
        setShowMeaning(false);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.endsWith('.xlsx') || 
                     file.name.endsWith('.xls');
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      
      if (isExcel || isCSV) {
        handleFileUpload(file);
      } else {
        alert('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)');
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const nextCard = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowMeaning(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowMeaning(false);
    }
  };

  const toggleMeaning = () => {
    setShowMeaning(!showMeaning);
  };

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎯 Flashcard Từ Vựng
            </h1>
            <p className="text-lg text-gray-600">
              Kéo thả file CSV hoặc click để chọn file
            </p>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="space-y-4">
              <div className="text-6xl text-gray-400">📊</div>
              <h3 className="text-xl font-semibold text-gray-900">
                {isDragging ? 'Thả file vào đây' : 'Kéo thả file CSV vào đây'}
              </h3>
              <p className="text-gray-600">
                Hoặc click để chọn file
              </p>
              <p className="text-sm text-gray-500">
                File Excel/CSV cần có các cột: kanji, phonetic, meaning, example
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full h-screen flex flex-col items-center">
        {/* Header */}
        <div className="text-center py-8 w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Học Từ Vựng
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Thẻ {currentCard + 1} / {cards.length}
          </p>
          <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg inline-block whitespace-nowrap overflow-hidden">
            <span className="hidden sm:inline">⌨️</span> <kbd className="px-1 py-1 bg-white rounded border text-[10px]">←</kbd> <kbd className="px-1 py-1 bg-white rounded border text-[10px]">→</kbd> <span className="hidden sm:inline">Chuyển card</span> | <kbd className="px-1 py-1 bg-white rounded border text-[10px]">Space</kbd> <span className="hidden sm:inline">Xem nghĩa</span> | <kbd className="px-1 py-1 bg-white rounded border text-[10px]">ESC</kbd> <span className="hidden sm:inline">Quay lại</span>
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[500px]">
            <div className="text-center">
              <div className="text-[8rem] font-black text-indigo-600 mb-8">
                {cards[currentCard]?.kanji || '漢'}
              </div>
              
              {!showMeaning ? (
                <button
                  onClick={toggleMeaning}
                  className="px-10 py-6 bg-indigo-600 text-white text-3xl font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl"
                >
                  👆 Bấm để xem nghĩa
                </button>
              ) : (
                <div className="space-y-8">
                  {cards[currentCard]?.phonetic && (
                    <div className="text-4xl text-gray-700 bg-gray-100 px-8 py-4 rounded-2xl inline-block font-mono">
                      {cards[currentCard]?.phonetic}
                    </div>
                  )}
                  
                  {cards[currentCard]?.meaning && (
                    <div className="bg-indigo-50 rounded-2xl p-8">
                      <div className="text-2xl text-indigo-600 font-bold mb-4">
                        Nghĩa:
                      </div>
                      <div className="text-4xl font-bold text-gray-800">
                        {cards[currentCard]?.meaning}
                      </div>
                    </div>
                  )}
                  
                  {cards[currentCard]?.example && (
                    <div className="bg-purple-50 rounded-2xl p-8">
                      <div className="text-2xl text-purple-600 font-bold mb-4">
                        Ví dụ:
                      </div>
                      <div className="text-2xl text-gray-700 font-mono">
                        {cards[currentCard]?.example}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={toggleMeaning}
                    className="px-10 py-6 bg-gray-600 text-white text-3xl font-bold rounded-2xl hover:bg-gray-700 transition-colors shadow-xl"
                  >
                    👆 Bấm để quay lại
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevCard}
            disabled={currentCard === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Trước
          </button>
          
          <button
            onClick={() => {
              setCards([]);
              setCurrentCard(0);
              setShowMeaning(false);
              // Xóa localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('flashcards');
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Xóa tất cả
          </button>
          
          <button
            onClick={nextCard}
            disabled={currentCard === cards.length - 1}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Tiếp →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
