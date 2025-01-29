from langrid.clients import TranslationClient
from settings import lg_config
import asyncio

# 入力言語および出力言語のリスト
languages = {
    1: 'ja',  # 日本語
    2: 'en',  # 英語
    3: 'pt',  # ポルトガル語
    4: 'es',  # スペイン語
    5: 'zh-CN',  # 中国語（簡体字）
    6: 'zh-TW',  # 中国語（繁体字）
    7: 'ko',  # 韓国語
    8: 'tl',  # タガログ語
    9: 'vi',  # ベトナム語
    10: 'id',  # インドネシア語
    11: 'ne'  # ネパール語
}
async def translate_question(question, main_language):
    """
    指定された言語にクイズの質問を翻訳する関数。
    """
    gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',
                             lg_config['userid'], lg_config['password'])
    lang = languages[main_language]

    # 翻訳の呼び出しを await で待機
    translated_question = gnmt.translate("ja", lang, question)
    return translated_question

async def translate_quizz(question,a,b,c,d):
    """
    日本語で作成されたクイズを他の言語に翻訳し、翻訳結果をリストに格納する関数。
    """
    translated_quiz_list = []
    gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',
                             lg_config['userid'], lg_config['password'])
    i=1
    for target_lang_id in languages:
        target_lang = languages[target_lang_id]
        translation = []
        if i == 1:
            translation.append(question)
            translation.append(a)
            translation.append(b)
            translation.append(c)
            translation.append(d)
            translated_quiz_list.append(translation)
            i += 1
        else:
            # 質問文と選択肢を非同期に翻訳
            translation.append(gnmt.translate("ja",target_lang,question))
            translation.append(gnmt.translate("ja",target_lang,a))
            translation.append(gnmt.translate("ja",target_lang,b))
            translation.append(gnmt.translate("ja",target_lang,c))
            translation.append(gnmt.translate("ja",target_lang,d))
            translated_quiz_list.append(translation)
            i += 1
    return translated_quiz_list
