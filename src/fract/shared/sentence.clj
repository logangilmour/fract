(ns fract.shared.sentence
  (:require [clojure.string :as st]))

(def cur (atom 0))

(defn sentence [id text]
  (str "<span id='" (or id (swap! cur (fn [old] (+ 1 old)))) "'>" text "</span>"))

(defn spanner [span id]
  (let [parts (st/split span #"(?=[\.!?]\s+)")]
      (apply str (cons (sentence id (first parts))
      (map (partial sentence nil)
           (rest parts))))))


