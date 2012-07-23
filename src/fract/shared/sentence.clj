(ns fract.shared.sentence
  (:require [clojure.string :as s]))

(defn parse [text]
  (s/split text #"\."))

(defn decorate [sentenceList]
  (map (fn [sentence] [:span sentence]) sentenceList))

(defn transform [text]
  (decorate (parse text)))