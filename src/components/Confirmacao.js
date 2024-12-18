import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/confirmacao.css';

const Confirmacao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const CONSULTA_URL = 'https://sport-bike-web.vercel.app/';

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        if (orderId) {
          const orderRef = doc(db, 'ordens', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            setOrderData(orderDoc.data());
          } else {
            alert('Ordem não encontrada');
            navigate('/');
          }
        } else if (location.state?.codigoOS) {
          setOrderData(location.state);
        } else {
          navigate('/');
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar ordem:', error);
        alert('Erro ao carregar dados da ordem');
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, location.state, navigate]);

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });
  
      const addVia = async (startY) => {
        // Configurações iniciais da página
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        let currentY = startY;
  
        // Função para calcular altura necessária
        const calculateNeededHeight = () => {
          // Altura base para cabeçalho e informações do cliente
          let neededHeight = 60;
          
          // Adiciona altura para cada bicicleta
          orderData.bicicletas.forEach(bike => {
            neededHeight += 20; // Cabeçalho da bike
            neededHeight += (Object.keys(bike.services).length * 6); // Serviços
            if (bike.observacoes) neededHeight += 8;
            neededHeight += 10; // Total da bike
          });
  
          // Altura para total geral e termos
          neededHeight += 40;
  
          return neededHeight;
        };
  
        // Calcula se precisa de nova página
        const totalNeededHeight = calculateNeededHeight();
        const canFitTwoVias = totalNeededHeight * 2 + 20 <= pageHeight;
  
        // Logo e cabeçalho
        const logoWidth = 20;
        const logoHeight = 20;
        pdf.addImage('/Logo.png', 'PNG', margin, currentY, logoWidth, logoHeight);
  
        // Cabeçalho centralizado
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("ORDEM DE SERVIÇO", pageWidth / 2, currentY + 10, { align: "center" });
        // Informações da empresa
      currentY += 15;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
      pdf.text("Tel: (85) 3267-7425 | (85) 3122-5874 | WhatsApp: (85) 3267-7425", pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
      pdf.text("@sportbike_fortaleza | comercialsportbike@gmail.com", pageWidth / 2, currentY, { align: "center" });

      // Número da OS e Datas
      currentY += 8;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(`OS: ${orderData.codigo}`, margin, currentY);
      currentY += 5;
      pdf.setFont("helvetica", "normal");
      const dataCriacao = new Date(orderData.dataCriacao).toLocaleString();
      const dataAgendamento = new Date(orderData.dataAgendamento).toLocaleString();
      pdf.text(`Criada em: ${dataCriacao}`, margin, currentY);
      currentY += 5;
      pdf.text(`Agendada para: ${dataAgendamento}`, margin, currentY);

      // Dados do Cliente
      currentY += 8;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO CLIENTE", margin, currentY);
      currentY += 5;
      pdf.setFont("helvetica", "normal");
      pdf.text(`Nome: ${orderData.cliente.nome}`, margin, currentY);
      currentY += 5;
      pdf.text(`Telefone: ${orderData.cliente.telefone}`, margin, currentY);
      
      if (orderData.cliente.endereco) {
        currentY += 5;
        pdf.text(`Endereço: ${orderData.cliente.endereco}`, margin, currentY);
      }

      // Processamento das bicicletas
      currentY += 10;

      for (let i = 0; i < orderData.bicicletas.length; i++) {
        const bike = orderData.bicicletas[i];
        
        // Verifica espaço disponível
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = margin;
        }

        // Cabeçalho da bicicleta
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(`BICICLETA ${i + 1}: ${bike.marca} - ${bike.modelo} - ${bike.cor}`, margin, currentY);
        currentY += 6;

        // Cabeçalho dos serviços
        pdf.setFontSize(9);
        pdf.text("Serviço", margin, currentY);
        pdf.text("Qtd", pageWidth - 70, currentY);
        pdf.text("Valor", pageWidth - 40, currentY);
        currentY += 4;

        // Lista de serviços
        pdf.setFont("helvetica", "normal");
        
        Object.entries(bike.services)
          .filter(([_, quantity]) => quantity > 0)
          .forEach(([service, quantity]) => {
            const serviceValue = (bike.serviceValues?.[service]?.valorFinal || 
                                bike.serviceValues?.[service]?.valor || 
                                bike.total / Object.keys(bike.services).length);
            const total = serviceValue * quantity;
            
            pdf.text(`• ${service}`, margin, currentY);
            pdf.text(`${quantity}`, pageWidth - 70, currentY, { align: "right" });
            pdf.text(`R$ ${total.toFixed(2)}`, pageWidth - 40, currentY, { align: "right" });
            currentY += 5;
          });
          // Total da bicicleta
        pdf.setFont("helvetica", "bold");
        pdf.text(`Total: R$ ${bike.total.toFixed(2)}`, pageWidth - 40, currentY, { align: "right" });
        currentY += 8;
      }

      // Total Geral e QR Code
      currentY += 5;
      const qrCodeElement = document.getElementById('qr-code');
      
      if (qrCodeElement) {
        try {
          const canvas = await html2canvas(qrCodeElement);
          const qrCodeImage = canvas.toDataURL('image/png');
          const qrSize = 25;
          const qrX = pageWidth - margin - qrSize;
          
          // Posiciona o QR Code à direita
          pdf.addImage(qrCodeImage, 'PNG', qrX, currentY - 5, qrSize, qrSize);
          
          // Total Geral ao lado do QR Code
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(`TOTAL GERAL: R$ ${orderData.valorTotal.toFixed(2)}`, margin, currentY + 10);
          
          currentY += qrSize + 5;
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
          // Se falhar o QR Code, ainda mostra o total
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(`TOTAL GERAL: R$ ${orderData.valorTotal.toFixed(2)}`, margin, currentY);
          currentY += 10;
        }
      }

      // Termos e condições
      currentY += 5;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      
      const terms = [
        "• O prazo para conclusão do serviço pode ser estendido em até 2 dias após a data agendada.",
        "• Caso a bicicleta ou peças não sejam retiradas no prazo de 180 dias após o término",
        "  do serviço, serão vendidas para custear as despesas."
      ];

      terms.forEach(term => {
        pdf.text(term, margin, currentY);
        currentY += 4;
      });

      return currentY; // Retorna a posição Y final
    };

    // Decide se gera uma ou duas páginas
    const firstViaY = 10;
    const firstViaEndY = await addVia(firstViaY);
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Se a primeira via ocupou menos que metade da página, adiciona a segunda via na mesma página
    if (firstViaEndY < (pageHeight / 2)) {
      await addVia(firstViaEndY + 20);
    } else {
      // Senão, adiciona nova página para a segunda via
      pdf.addPage();
      await addVia(10);
    }

    // Salva o PDF
    pdf.save(`OS-${orderData.codigo}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};

  const handleDownloadQR = async () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (qrCodeElement) {
      try {
        const canvas = await html2canvas(qrCodeElement);
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `QRCode-${orderData.codigo}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erro ao baixar QR Code:', error);
        alert('Erro ao baixar QR Code. Tente novamente.');
      }
    }
  };

  const handleFinalizar = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!orderData) {
    return <div className="error-message">Dados da ordem de serviço não encontrados</div>;
  }

 return (
    <div className="confirmacao-container">
      <div className="confirmacao-content">
        <h1>Ordem de Serviço Finalizada!</h1>
        
        <p className="instructions">
          Use o código abaixo para acompanhar o status do seu pedido.
        </p>
        <p className="site-url">No site: {CONSULTA_URL}</p>

        <div className="codigo-box">
          <p>Código da Ordem de Serviço:</p>
          <strong>{orderData.codigo}</strong>
        </div>

        <div className="message-box">
          <p>Seu serviço está agendado para: {new Date(orderData.dataAgendamento).toLocaleDateString()}</p>
          <p className="prazo-info">Para garantir a melhor qualidade do serviço, em casos excepcionais, 
          a revisão pode ser finalizada em até 2 dias após a data agendada. 
          Faremos o possível para entregar no prazo!</p>
        </div>

        <div className="instrucoes">
          <p className="destaque">• Salve o QR Code para acompanhar o status do seu serviço</p>
          <p className="destaque">• Baixe a versão PDF com todos os detalhes da sua ordem</p>
          <p>• Escaneie o QR code para acessar sua ordem de serviço no site</p>
        </div>

        <div className="qr-code-container">
          <div id="qr-code" className="qr-code">
            <QRCodeSVG 
              value={CONSULTA_URL} 
              size={200} 
              level="H"
              includeMargin={true}
            />
          </div>
          <button onClick={handleDownloadQR} className="download-button">
            Salvar QR Code
          </button>
        </div>

        <div className="buttons-container">
          <button 
            onClick={generatePDF}
            className="pdf-button"
          >
            Gerar PDF da Ordem
          </button>
          <button 
            onClick={handleFinalizar}
            className="finish-button"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmacao;