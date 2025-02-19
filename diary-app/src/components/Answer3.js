import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from '../config'; 
import axios from "axios";
import JSZip from "jszip"; // jszipをインポート

const Answer3 = () => {
  const { diaryId } = useParams(); // URLからdiaryIdを取得
  const [sameQuiz, setSameQuiz] = useState(); // get_same_quiz のデータを保存する状態
  const [differentQuiz, setDifferentQuiz] = useState(); // get_different_quiz のデータを保存する状態
  const [judgement, setJudgement] = useState(null); // 正解・不正解を保存する状態
  const [selectedChoice, setSelectedChoice] = useState(null); // ユーザーの選択を保存
  const [correctChoice, setCorrectChoice] = useState(null); // 正解の選択肢を保存
  const [audioFiles, setAudioFiles] = useState([]); // 音声ファイルを保存する状態
  const navigate = useNavigate();

  // クイズとジャッジメントを取得する関数
  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("access_token"); // トークンを取得

      // get_same_quiz/{diary_id} からクズを取得
      const sameQuizResponse = await axios.get(`${API_BASE_URL}/get_same_quiz/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSameQuiz(sameQuizResponse.data.quizzes[2]); // 最初のクイズを設定

      // get_different_quiz/{diary_id} からクイズを取得
      const differentQuizResponse = await axios.get(`${API_BASE_URL}/get_different_quiz/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDifferentQuiz(differentQuizResponse.data.quizzes[2]); // 最初のクイズを設定

      // get_judgement/{diary_id} から正解・不正解を取得
      const judgementResponse = await axios.get(`${API_BASE_URL}/get_judgement3/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJudgement(judgementResponse.data.judgement); // ジャッジメントの結果を保存
      setSelectedChoice(judgementResponse.data.selected_choice); // 選択した選択肢を保存
      setCorrectChoice(judgementResponse.data.correct_choice); // 正解の選択肢を保存

      // 音声ファイルを取得
      await fetchAudio();
    } catch (err) {
      console.error("ERROR", err);
    }
  };

  const fetchAudio = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/get_quiz_audio3/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer", // バイナリデータを受け取る
      });
      // ZIPファイルを解凍
      const zip = await JSZip.loadAsync(response.data);
      const audioFilePromises = [];
      // 音声ファイルのPromiseを配列に格納
      zip.forEach((relativePath, file) => {
        const filePromise = file.async("blob").then((blob) => {
          return {
            name: relativePath,
            url: URL.createObjectURL(blob),
          };
        });
        audioFilePromises.push(filePromise);
      });
      // すべての音声ファイルの読み込みが終わるのを待つ
      const audioFilesArray = await Promise.all(audioFilePromises);
      // 音声ファイルをセット
      setAudioFiles(audioFilesArray);
    } catch (err) {
      console.error("ERROR", err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [diaryId]);

  const handleSubmit = () => {
    navigate(`/Question4/${diaryId}`); // 次の画面に遷移
  };

  // クイズデータがまだ読み込まれていない場合、ローディングを表示
  if (!sameQuiz || !differentQuiz || audioFiles.length === 0) {
    return <div>Loading...</div>;
  }

 // 2つの選択肢を交互に表示する処理
 const mergedChoices = [];
 const sameChoices = Object.entries(sameQuiz.choices);
 const differentChoices = Object.entries(differentQuiz.choices);
 const maxLength = Math.max(sameChoices.length, differentChoices.length);

 for (let i = 0; i < maxLength; i++) {
   if (i < sameChoices.length) mergedChoices.push({ key: sameChoices[i][0], text: sameChoices[i][1], type: "same" });
   if (i < differentChoices.length) mergedChoices.push({ key: differentChoices[i][0], text: differentChoices[i][1], type: "different" });
 }

  const getChoiceStyle = (choice) => {
    if (selectedChoice && correctChoice) {
      if (selectedChoice.toUpperCase() === choice.key.toUpperCase()) {
        return { backgroundColor: "#4CAF50", color: "#fff" }; // ユーザーの選択肢を緑に
      }
      if (choice.key.toUpperCase() === correctChoice.toUpperCase()) {
        return { backgroundColor: "#F44336", color: "#fff" }; // 正解の選択肢を赤に
      }
    }
    return {}; // その他の選択肢は変更なし
  };

  const playAudio = (choiceKey) => {
    const audioName = `${choiceKey}.mp3`; // a, b, c, d に変更
    console.log(`再生する音声ファイル名: ${audioName}`); // 再生するファイル名を確認
    console.log("選択されたオプションのキー:", choiceKey);  // choiceKey が正しいか確認
    console.log("生成された音声ファイル名:", audioName);  // 正しいファイル名が生成されているか確認

    // audioFiles 配列の中身を確認
    console.log(audioFiles); 
  
    const file = audioFiles.find(file => file.name === audioName);
    if (file) {
      const audio = new Audio(file.url);
      audio.play();
    } else {
      console.error(`Audio file not found: ${audioName}`);
    }
  };

  return (
    <div style={styles.container}>
      {judgement !== null && (
        <div style={styles.judgement}>
          <h3>{judgement ? "O" : "X"}</h3>
        </div>
      )}
      {/* sameQuizが表示される部分 */}
      {sameQuiz && (
        <h3>Q3 <u>{sameQuiz.question}</u></h3>
      )}
      <div style={styles.options}>
        {mergedChoices.map((choice, index) => (
          <div
            key={index}
            style={{
              ...styles.option,
              ...getChoiceStyle(choice),
            }}
            onClick={() => playAudio(choice.key)} // 音声を再生
          >
            <p>{choice.key.toUpperCase()}. {choice.text}</p>
          </div>
        ))}
      </div>
      {selectedChoice && (
        <div style={styles.result}>
          <p><strong>Your Select:</strong> {selectedChoice.toUpperCase()}</p>
          <p><strong>Correct:</strong> {correctChoice}</p>
        </div>
      )}
      <button onClick={handleSubmit} style={styles.submitButton}>
        Next!!!
      </button>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "100px",
    maxWidth: "1000px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    backgroundColor: "#F9F9F9",
    margin: "0 auto",
  },
  options: {
    marginTop: "20px",
  },
  option: {
    marginBottom: "15px",
    padding: "10px",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: "5px",
    transition: "background-color 0.3s ease",
  },
  judgement: {
    textAlign: "center",
    fontSize: "24px",
    color: "#4CAF50",
    fontWeight: "bold",
  },
  result: {
    marginTop: "20px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#E0F7FA",
  },
  submitButton: {
    marginTop: "30px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "15px 30px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default Answer3;
