import sys
from backend.app.services.sentence_selection import SentenceSelectionService
from backend.app.services.summary_generator import AbstractiveGeneratorService
from backend.app.services.factual_verification import FactualVerificationService
from backend.app.services.evaluation import ResearchEvaluationService
from backend.app.database.db import init_db

init_db()
text = (
    "Recent advancements in silicon spin qubits have positioned quantum computing at the brink of commercial viability. "
    "Operating at millikelvin temperatures within dilution refrigerators, silicon-based spin processors demonstrate coherence times exceeding several milliseconds. "
    "However, scaling these systems to thousands of interconnected qubits introduces significant interconnect bottlenecks and thermal dissipation hurdles. "
    "To mitigate thermal load, researchers are designing integrated cryogenic CMOS controllers that operate natively at 4 Kelvin, directly adjacent to the quantum plane. "
    "Experimental results show that cryogenic CMOS circuits can deliver high-fidelity microwave control pulses while consuming less than 1.2 milliwatts per qubit channel. "
    "This monolithic control paradigm drastically reduces cable harness complexity and mitigates signal crosstalk. "
    "Nevertheless, magnetic drift and charge noise continue to limit two-qubit gate fidelities to approximately 99.4%, falling slightly short of fault-tolerant surface code thresholds."
)

print("Running Module 1 (GAN + TLSTM + RL)...")
m1 = SentenceSelectionService().process(text, max_sentences=3)
print(f"M1 Extractive summary sentences: {len(m1['selected_sentences'])}")

print("Running Module 2 (Redundancy Filter + LLM Abstractive)...")
m2 = AbstractiveGeneratorService().process(m1['selected_sentences'], original_document=text)
print(f"M2 Abstractive Summary: {m2['abstractive_summary']}")

print("Running Module 3 (Factual Consistency Verification)...")
m3 = FactualVerificationService().verify_and_optimize(text, m2['abstractive_summary'])
print(f"M3 FCS: {m3['factual_consistency_score']}% | Claims verified: {len(m3['claims'])}")

print("Running Evaluation...")
eval_res = ResearchEvaluationService().evaluate(text, m3['final_summary'])
print(f"Evaluation: ROUGE-1={eval_res['rouge']['rouge1']}, ROUGE-2={eval_res['rouge']['rouge2']}, ROUGE-L={eval_res['rouge']['rougeL']}")
print("PIPELINE TEST PASSED SUCCESSFULLY!")
